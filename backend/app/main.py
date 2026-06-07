import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.services.redis_service import redis_client
from app.models.isolation_forest import anomaly_detector
from app.services.qdrant_service import qdrant_svc
from app.services.db_service import init_db
from app.core.pipeline import start_pipeline_loop
from app.routers import metrics, logs, incidents, rag, actions, health
from app.routers import settings as settings_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=== Inertia Starting Up ===")
    init_db()
    redis_client.connect()
    anomaly_detector.initialize()
    qdrant_svc.initialize()
    pipeline_task = asyncio.create_task(start_pipeline_loop())
    logger.info("=== Inertia Ready ===")
    yield
    logger.info("=== Inertia Shutting Down ===")
    pipeline_task.cancel()
    try:
        await pipeline_task
    except asyncio.CancelledError:
        pass
    redis_client.disconnect()

app = FastAPI(title="Inertia API", version="2.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(metrics.router,         prefix="/api/metrics",   tags=["Metrics"])
app.include_router(logs.router,            prefix="/api/logs",      tags=["Logs"])
app.include_router(incidents.router,       prefix="/api/incidents", tags=["Incidents"])
app.include_router(rag.router,             prefix="/api/rag",       tags=["RAG"])
app.include_router(actions.router,         prefix="/api/actions",   tags=["Actions"])
app.include_router(health.router,          prefix="/api/health",    tags=["Health"])
app.include_router(settings_router.router, prefix="/api/settings",  tags=["Settings"])

@app.get("/")
def root():
    return {"service": "Inertia API", "version": "2.1.0", "status": "operational"}
