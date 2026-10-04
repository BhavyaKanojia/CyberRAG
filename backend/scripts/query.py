import os
import sys
from pathlib import Path

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from fastembed import TextEmbedding
from groq import Groq

# Load .env from project root
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    raise ValueError("GROQ_API_KEY not found. Please verify your .env file.")

QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", 6333))
COLLECTION_NAME = "cisa_kev_threat_intel"

# Initialize resources
print("Initializing Qdrant client and lightweight embedding model...")
if QDRANT_URL:
    print(f"Connecting to Qdrant Cloud at {QDRANT_URL}...")
    qdrant = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY, timeout=60)
else:
    print(f"Connecting to local Qdrant at {QDRANT_HOST}:{QDRANT_PORT}...")
    qdrant = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT, timeout=60)

embedder = TextEmbedding(model_name="BAAI/bge-base-en-v1.5")
groq_client = Groq(api_key=api_key)

def ask_cyberrag(user_query: str):
    print(f"\n[Query] \"{user_query}\"")
    print("Searching Qdrant for matching threat intelligence...")
    
    # 1. Local Dense Search (Cosine Similarity via fastembed)
    query_vector = list(embedder.embed([user_query]))[0].tolist()
    
    # query_points replaces search in qdrant-client >= 1.10
    search_results = qdrant.query_points(
        collection_name=COLLECTION_NAME,
        query=query_vector,
        limit=4
    ).points
    
    # 2. Extract Context and Build Source Delimiters
    context_blocks = []
    allowed_sources = []
    for hit in search_results:
        cve_id = hit.payload.get("cve_id", "Unknown")
        allowed_sources.append(cve_id)
        text = hit.payload.get("text", "")
        context_blocks.append(f"[Source: {cve_id}]\n{text}")
    
    combined_context = "\n\n---\n\n".join(context_blocks)
    
    # 3. Grounded Prompt with Anti-Hallucination & User-Friendly Tone
    system_prompt = (
        "You are CyberRAG, a friendly, helpful, and expert cybersecurity threat intelligence assistant.\n"
        "Your mission is to explain complex vulnerabilities and threat data in simple, clear, and actionable language so anyone can easily understand their risk and remediation.\n\n"
        "Response Structure Guidelines:\n"
        "1. **Quick Summary (Plain English)**: Start with a brief, friendly 1-2 sentence overview explaining the core risk simply.\n"
        "2. **Threat Breakdown**: List the relevant vulnerabilities clearly with their impact and always cite the source with [Source: CVE-XXXX-XXXX].\n"
        "3. **What You Should Do (Action Steps)**: Provide clear, bulleted steps for mitigation, patching, or workarounds.\n"
        "4. **Interactive Follow-up**: End with a friendly, helpful question or suggested next step.\n\n"
        "Strict Grounding Rules:\n"
        "- Only use information present in the provided context.\n"
        "- Every vulnerability statement must cite its exact source, e.g. [Source: CVE-XXXX-XXXX].\n"
        "- If the context lacks data on a requested product/topic, politely explain what is available instead of making up facts."
    )
    
    user_prompt = f"Threat Intelligence Context:\n{combined_context}\n\nUser Question: {user_query}\n\nPlease provide a clear, friendly, and structured response:"
    
    # 4. Inference via Groq Free Tier
    model_name = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    print(f"Generating response via Groq ({model_name})...")
    chat_completion = groq_client.chat.completions.create(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        model=model_name,
        temperature=0.1
    )
    
    print("\n--- RETRIEVED SOURCES ---")
    print(", ".join(allowed_sources))
    print("\n--- CYBERRAG RESPONSE ---")
    print(chat_completion.choices[0].message.content)

if __name__ == "__main__":
    query = "What known vulnerabilities affect Palo Alto Networks products and what actions are required?"
    ask_cyberrag(query)
