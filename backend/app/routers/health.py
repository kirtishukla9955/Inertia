import time
import logging
from fastapi import APIRouter
from app.services.redis_service import redis_client
from app.models.isolation_forest import anomaly_detector
from app.services.qdrant_service import qdrant_svc
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

START_TIME = time.time()

def check_service(fn):
    t0 = time.time()
    try:
        fn()
        latency = round((time.time() - t0) * 1000, 1)
        return {"status": "UP", "latency_ms": latency}
    except Exception as e:
        return {"status": "DOWN", "latency_ms": None, "error": str(e)[:100]}

@router.get("")
def health_check():
    uptime_seconds = round(time.time() - START_TIME)
    days = uptime_seconds // 86400
    hours = (uptime_seconds % 86400) // 3600
    mins = (uptime_seconds % 3600) // 60

    redis_status = check_service(lambda: redis_client.client.ping())
    qdrant_status = check_service(lambda: qdrant_svc.client.get_collections())

    if_status = {
        "status": "UP" if anomaly_detector.is_initialized else "DEGRADED",
        "latency_ms": None
    }

    ollama_status = {"status": "UNKNOWN", "latency_ms": None}
    try:
        import httpx, asyncio
        t0 = time.time()
        r = httpx.get(f"{settings.OLLAMA_URL}/api/tags", timeout=3.0)
        latency = round((time.time() - t0) * 1000, 1)
        ollama_status = {"status": "UP" if r.status_code == 200 else "DEGRADED", "latency_ms": latency}
    except Exception as e:
        ollama_status = {"status": "DOWN", "latency_ms": None, "error": str(e)[:80]}

    services = {
        "api_server":       {"status": "UP", "latency_ms": 0},
        "redis_stream":     redis_status,
        "qdrant_vector_db": qdrant_status,
        "isolation_forest": if_status,
        "ollama_llm":       ollama_status,
        "webhook_hub":      {"status": "UP", "latency_ms": 0},
    }

    all_up = all(s.get("status") == "UP" for s in services.values())
    overall = "healthy" if all_up else "degraded"

    return {
        "overall": overall,
        "uptime": f"{days}d {hours}h {mins}m",
        "uptime_seconds": uptime_seconds,
        "services": services
    }
