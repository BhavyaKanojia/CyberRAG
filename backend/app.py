import os
import sys
from pathlib import Path
from typing import List, Optional

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from sentence_transformers import SentenceTransformer
from groq import Groq
import requests

# Load .env
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", 6333))
COLLECTION_NAME = "cisa_kev_threat_intel"
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

app = FastAPI(
    title="CyberRAG Intelligence Engine API",
    description="Anti-Hallucination Threat Intelligence Retrieval-Augmented Generation API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global persistent singletons
print("[CyberRAG] Initializing in-memory embedding model and vector client...")
qdrant = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
embedder = SentenceTransformer("BAAI/bge-base-en-v1.5")
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None


class QueryRequest(BaseModel):
    query: str
    limit: Optional[int] = 4
    model: Optional[str] = None
    temperature: Optional[float] = 0.1
    vendor_filter: Optional[str] = None


class RetrievedSource(BaseModel):
    cve_id: str
    vendor: str
    product: str
    similarity_score: float
    text: str


class QueryResponse(BaseModel):
    query: str
    response: str
    sources: List[RetrievedSource]
    model_used: str
    execution_time_ms: float


class IngestRequest(BaseModel):
    limit: Optional[int] = 300


@app.get("/api/health")
def health_check():
    try:
        exists = qdrant.collection_exists(COLLECTION_NAME)
        count = 0
        if exists:
            count = qdrant.count(collection_name=COLLECTION_NAME).count
        return {
            "status": "healthy",
            "qdrant_connected": True,
            "collection_exists": exists,
            "indexed_records": count,
            "groq_configured": bool(GROQ_API_KEY),
            "model_default": GROQ_MODEL,
        }
    except Exception as e:
        return {
            "status": "degraded",
            "error": str(e),
            "qdrant_connected": False
        }


@app.get("/api/cves")
def list_cves(limit: int = 50, offset: int = 0, vendor: Optional[str] = None):
    try:
        if not qdrant.collection_exists(COLLECTION_NAME):
            return {"total": 0, "cves": []}

        records, _ = qdrant.scroll(
            collection_name=COLLECTION_NAME,
            limit=limit,
            offset=offset,
            with_payload=True,
            with_vectors=False
        )

        cves = []
        for rec in records:
            p = rec.payload or {}
            if vendor and vendor.lower() not in p.get("vendor", "").lower():
                continue
            cves.append({
                "id": rec.id,
                "cve_id": p.get("cve_id", "Unknown"),
                "vendor": p.get("vendor", "Unknown"),
                "product": p.get("product", "Unknown"),
                "text": p.get("text", ""),
                "source": p.get("source", "CISA-KEV")
            })

        total = qdrant.count(collection_name=COLLECTION_NAME).count
        return {"total": total, "cves": cves}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/query", response_model=QueryResponse)
def query_threat_intel(req: QueryRequest):
    import time
    start_time = time.time()

    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    if not qdrant.collection_exists(COLLECTION_NAME):
        raise HTTPException(status_code=404, detail="Collection not indexed. Please run ingestion first.")

    # 1. Local Dense Vector Search
    query_vector = embedder.encode(req.query).tolist()
    search_res = qdrant.query_points(
        collection_name=COLLECTION_NAME,
        query=query_vector,
        limit=req.limit or 4
    ).points

    sources = []
    context_blocks = []

    for hit in search_res:
        payload = hit.payload or {}
        cve_id = payload.get("cve_id", "Unknown")
        vendor = payload.get("vendor", "Unknown")
        product = payload.get("product", "Unknown")
        text = payload.get("text", "")
        score = round(float(hit.score), 4)

        sources.append(RetrievedSource(
            cve_id=cve_id,
            vendor=vendor,
            product=product,
            similarity_score=score,
            text=text
        ))
        context_blocks.append(f"[Source: {cve_id} | Vendor: {vendor} | Score: {score}]\n{text}")

    combined_context = "\n\n---\n\n".join(context_blocks)

    system_prompt = (
        "You are CyberRAG, an authoritative threat intelligence and CVE analyst assistant.\n"
        "Core Directives:\n"
        "1. Strictly ground all answers in the provided context.\n"
        "2. Directly cite each statement with bracketed sources like [Source: CVE-XXXX-XXXX].\n"
        "3. Highlight technical impacts, exploitation status, and mandatory vendor/CISA mitigation deadlines.\n"
        "4. If the context does not contain sufficient details to answer, state: "
        "'Based on available threat intelligence data, there is insufficient evidence to answer this.'\n"
        "5. Maintain a structured, professional cybersecurity analyst tone."
    )

    user_prompt = f"Context:\n{combined_context}\n\nAnalyst Query: {req.query}\nAnswer:"

    model_to_use = req.model or GROQ_MODEL

    if not groq_client:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured in .env.")

    try:
        completion = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            model=model_to_use,
            temperature=req.temperature if req.temperature is not None else 0.1
        )
        answer = completion.choices[0].message.content
    except Exception as e:
        # Graceful fallback to secondary model if requested model is unavailable
        try:
            fallback_model = "qwen/qwen3.8-27b"
            completion = groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                model=fallback_model,
                temperature=0.1
            )
            answer = completion.choices[0].message.content
            model_to_use = fallback_model
        except Exception as e2:
            raise HTTPException(status_code=500, detail=f"LLM generation failed: {str(e2)}")

    elapsed = round((time.time() - start_time) * 1000, 2)
    return QueryResponse(
        query=req.query,
        response=answer,
        sources=sources,
        model_used=model_to_use,
        execution_time_ms=elapsed
    )


def run_ingest_sync(limit: int):
    try:
        url = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"
        resp = requests.get(url, timeout=30)
        vulns = resp.json().get("vulnerabilities", [])
        subset = vulns[:limit] if limit > 0 else vulns

        if not qdrant.collection_exists(COLLECTION_NAME):
            qdrant.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=VectorParams(size=768, distance=Distance.COSINE),
            )

        points = []
        for idx, item in enumerate(subset):
            chunk_text = (
                f"CVE ID: {item.get('cveID')}\n"
                f"Vendor/Project: {item.get('vendorProject')}\n"
                f"Product: {item.get('product')}\n"
                f"Vulnerability Name: {item.get('vulnerabilityName')}\n"
                f"Date Added: {item.get('dateAdded')}\n"
                f"Description: {item.get('shortDescription')}\n"
                f"Required Action: {item.get('requiredAction')}"
            )
            embedding = embedder.encode(chunk_text).tolist()
            payload = {
                "cve_id": item.get("cveID"),
                "vendor": item.get("vendorProject"),
                "product": item.get("product"),
                "text": chunk_text,
                "source": "CISA-KEV"
            }
            points.append(PointStruct(id=idx, vector=embedding, payload=payload))

        qdrant.upsert(collection_name=COLLECTION_NAME, points=points)
        print(f"[CyberRAG Ingest] Successfully indexed {len(points)} records.")
    except Exception as e:
        print(f"[CyberRAG Ingest Error] {e}")


@app.post("/api/sync")
def sync_dataset(req: IngestRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(run_ingest_sync, req.limit or 300)
    return {"status": "started", "message": f"Sync initiated for top {req.limit or 300} CISA KEV entries in background."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app:app", host="127.0.0.1", port=8000, reload=False)
