from fastapi import APIRouter
from pydantic import BaseModel
from app.config import settings

router = APIRouter()

class SettingsUpdate(BaseModel):
    OLLAMA_MODEL: str = None
    IF_CONTAMINATION: float = None
    IF_N_ESTIMATORS: int = None

@router.get("")
def get_settings():
    return {
        "OLLAMA_MODEL": settings.OLLAMA_MODEL,
        "OLLAMA_URL": settings.OLLAMA_URL,
        "REDIS_URL": settings.REDIS_URL,
        "QDRANT_HOST": settings.QDRANT_HOST,
        "QDRANT_PORT": settings.QDRANT_PORT,
        "IF_CONTAMINATION": settings.IF_CONTAMINATION,
        "IF_N_ESTIMATORS": settings.IF_N_ESTIMATORS,
        "WEBHOOK_SECRET": "****",
    }

@router.post("")
def update_settings(body: SettingsUpdate):
    if body.OLLAMA_MODEL:
        settings.OLLAMA_MODEL = body.OLLAMA_MODEL
    if body.IF_CONTAMINATION:
        settings.IF_CONTAMINATION = body.IF_CONTAMINATION
    if body.IF_N_ESTIMATORS:
        settings.IF_N_ESTIMATORS = body.IF_N_ESTIMATORS
    return {"status": "updated"}
