import os
from pathlib import Path
from dotenv import load_dotenv
import requests
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from fastembed import TextEmbedding

# Load .env
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", 6333))
COLLECTION_NAME = "cisa_kev_threat_intel"

# 1. Connect to Qdrant (Cloud or Local)
if QDRANT_URL:
    print(f"Connecting to Qdrant Cloud at {QDRANT_URL}...")
    client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY, timeout=60)
else:
    print(f"Connecting to local Qdrant at {QDRANT_HOST}:{QDRANT_PORT}...")
    client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT, timeout=60)

# 2. Re-create collection with 768-dim (matches BGE-base)
if not client.collection_exists(COLLECTION_NAME):
    client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(size=768, distance=Distance.COSINE),
    )

# 3. Load lightweight embedding model
print("Loading BAAI/bge-base-en-v1.5 via fastembed...")
model = TextEmbedding(model_name="BAAI/bge-base-en-v1.5")

# 4. Fetch CISA KEV JSON (Free & Public Domain)
print("Fetching official CISA KEV Catalog...")
url = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"
resp = requests.get(url, timeout=30)
vulns = resp.json().get("vulnerabilities", [])

# Index in batches of 50 for smooth network streaming
subset = vulns[:250]
print(f"Indexing {len(subset)} vulnerability records in batches...")

points = []
batch_size = 50
for idx, item in enumerate(subset):
    chunk_text = (
        f"CVE ID: {item['cveID']}\n"
        f"Vendor/Project: {item['vendorProject']}\n"
        f"Product: {item['product']}\n"
        f"Vulnerability Name: {item['vulnerabilityName']}\n"
        f"Date Added: {item['dateAdded']}\n"
        f"Description: {item['shortDescription']}\n"
        f"Required Action: {item['requiredAction']}"
    )
    
    embedding = list(model.embed([chunk_text]))[0].tolist()
    
    payload = {
        "cve_id": item["cveID"],
        "vendor": item["vendorProject"],
        "product": item["product"],
        "text": chunk_text,
        "source": "CISA-KEV"
    }
    
    points.append(PointStruct(id=idx, vector=embedding, payload=payload))
    
    if len(points) >= batch_size:
        client.upsert(collection_name=COLLECTION_NAME, points=points)
        print(f"Uploaded batch of {len(points)} points (total: {idx + 1}/{len(subset)})...")
        points = []

if points:
    client.upsert(collection_name=COLLECTION_NAME, points=points)
    print(f"Uploaded final batch of {len(points)} points...")

count = client.count(collection_name=COLLECTION_NAME).count
print(f"Successfully indexed {count} threat intelligence records in Qdrant Cloud!")