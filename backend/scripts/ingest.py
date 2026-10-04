import requests
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from sentence_transformers import SentenceTransformer

# 1. Connect to local Qdrant instance
client = QdrantClient(host="localhost", port=6333)
COLLECTION_NAME = "cisa_kev_threat_intel"

# 2. Re-create collection with 768-dim (matches BGE-base)
client.recreate_collection(
    collection_name=COLLECTION_NAME,
    vectors_config=VectorParams(size=768, distance=Distance.COSINE),
)

# 3. Load embedding model locally (Uses CUDA if PyTorch sees your RTX 3050)
print("Loading BAAI/bge-base-en-v1.5 locally...")
model = SentenceTransformer("BAAI/bge-base-en-v1.5")

# 4. Fetch CISA KEV JSON (Free & Public Domain)
print("Fetching official CISA KEV Catalog...")
url = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"
resp = requests.get(url, timeout=30)
vulns = resp.json().get("vulnerabilities", [])

# Let's index the first 250 records for a rapid, lightweight baseline
subset = vulns[:250]
print(f"Indexing {len(subset)} vulnerability records...")

points = []
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
    
    # Generate local embedding (no API billing)
    embedding = model.encode(chunk_text).tolist()
    
    payload = {
        "cve_id": item["cveID"],
        "vendor": item["vendorProject"],
        "product": item["product"],
        "text": chunk_text,
        "source": "CISA-KEV"
    }
    
    points.append(PointStruct(id=idx, vector=embedding, payload=payload))

client.upsert(collection_name=COLLECTION_NAME, points=points)
print(f"Successfully indexed {len(points)} threat intelligence records into Qdrant!")