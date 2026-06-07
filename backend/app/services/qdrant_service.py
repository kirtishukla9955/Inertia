import logging
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from sentence_transformers import SentenceTransformer
from app.config import settings

logger = logging.getLogger(__name__)

class QdrantService:
    def __init__(self):
        self.client = None
        self.encoder = None
        self.collection_name = "inertia_runbooks"

    def initialize(self):
        logger.info(f"Connecting to Qdrant at {settings.QDRANT_HOST}:{settings.QDRANT_PORT}...")
        try:
            self.client = QdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT)
            self.encoder = SentenceTransformer('all-MiniLM-L6-v2')
            collections = self.client.get_collections().collections
            if not any(c.name == self.collection_name for c in collections):
                logger.info(f"Creating collection '{self.collection_name}'...")
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(size=384, distance=Distance.COSINE),
                )
                self._seed_runbooks()
            else:
                logger.info(f"Collection '{self.collection_name}' already exists.")
        except Exception as e:
            logger.error(f"Failed to initialize Qdrant: {e}")

    def _seed_runbooks(self):
        logger.info("Seeding runbooks into Qdrant...")
        runbooks = [
            {
                "id": 1,
                "title": "DB Connection Pool Exhaustion",
                "content": "When 'too many connections' or 'connection pool exhausted' occurs at port 5432, the database has hit its connection limit. Active zombie processes are holding open connections without releasing them. Immediate action: kill zombie processes holding connections to port 5432. Then restart the db-pool service to restore healthy connections. Monitor RAM and latency for 60 seconds post-recovery.",
                "action": "flush_connections",
                "tags": ["database", "connection", "postgres"]
            },
            {
                "id": 2,
                "title": "Memory Leak — Heap Exhaustion",
                "content": "OutOfMemoryError or 'GC overhead limit exceeded' indicates a memory leak causing unbounded heap growth. RAM climbing steadily over time without garbage collection relief is the signature pattern. Restart the affected service immediately to clear the heap. Then roll back the most recent deployment. Enable heap dump collection on restart to diagnose the leak source.",
                "action": "restart_service",
                "tags": ["memory", "heap", "gc", "oom"]
            },
            {
                "id": 3,
                "title": "CPU Spike — Runaway Process",
                "content": "CPU usage above 92% with increasing request timeouts indicates a runaway compute process or hot loop. The api-server is likely stuck in a tight loop or handling a pathological input. Kill the runaway process and restart the api-server. If spiking recurs, scale horizontally by adding 2 pods to distribute load. Check recent deployments for loop conditions.",
                "action": "restart_service",
                "tags": ["cpu", "performance", "timeout", "spike"]
            },
            {
                "id": 4,
                "title": "Network Timeout Cascade",
                "content": "Upstream timeout and circuit breaker open errors on the gateway indicate cascading network failure across the service mesh. A downstream service is not responding within acceptable latency bounds causing the circuit breaker to trip. Redirect traffic to the fallback region immediately. Clear the cache layer to prevent stale routing data. Reset circuit breaker state after fallback stabilizes.",
                "action": "clear_cache",
                "tags": ["network", "timeout", "circuit-breaker", "gateway"]
            },
            {
                "id": 5,
                "title": "Auth Service Failure",
                "content": "Authentication service failures cause 401/403 cascades across all protected endpoints. If the auth-service pod crashes or is unreachable, all downstream services reject requests. Restart the auth-service container first. Verify JWT signing keys are still valid and accessible. If the issue persists, scale auth-service to 3 replicas for redundancy.",
                "action": "restart_service",
                "tags": ["auth", "jwt", "401", "403"]
            },
            {
                "id": 6,
                "title": "Cache Layer Saturation",
                "content": "Cache layer saturation causes dramatically increased database load as all requests bypass cache and hit the DB directly. Redis memory full or eviction policy set incorrectly. Run FLUSHDB to clear stale keys and reset eviction. Increase Redis maxmemory allocation. Review TTL settings on high-frequency keys.",
                "action": "clear_cache",
                "tags": ["cache", "redis", "saturation", "eviction"]
            },
        ]
        points = []
        for rb in runbooks:
            vector = self.encoder.encode(rb["content"]).tolist()
            points.append(PointStruct(
                id=rb["id"],
                vector=vector,
                payload={
                    "title": rb["title"],
                    "content": rb["content"],
                    "action": rb["action"],
                    "tags": rb["tags"]
                }
            ))
        self.client.upsert(collection_name=self.collection_name, points=points)
        logger.info("Runbooks seeded successfully.")

    def semantic_search(self, query: str, limit: int = 3):
        if not self.client or not self.encoder:
            return []
        try:
            query_vector = self.encoder.encode(query).tolist()
            try:
                result = self.client.query_points(
                    collection_name=self.collection_name,
                    query=query_vector,
                    limit=limit,
                )
                hits = result.points
            except AttributeError:
                hits = self.client.search(
                    collection_name=self.collection_name,
                    query_vector=query_vector,
                    limit=limit,
                )
            return [{"score": round(hit.score, 4), "payload": hit.payload} for hit in hits]
        except Exception as e:
            logger.error(f"Qdrant search error: {e}")
            return []

    def list_runbooks(self):
        if not self.client:
            return []
        try:
            points, _ = self.client.scroll(
                collection_name=self.collection_name,
                limit=50,
                with_payload=True,
                with_vectors=False
            )
            return [p.payload for p in points]
        except Exception as e:
            logger.error(f"Qdrant list error: {e}")
            return []

qdrant_svc = QdrantService()
