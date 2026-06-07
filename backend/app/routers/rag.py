from fastapi import APIRouter, Query, UploadFile, File
from app.services.qdrant_service import qdrant_svc

router = APIRouter()

@router.get("/search")
def rag_search(q: str = Query(...), limit: int = 5):
    results = qdrant_svc.semantic_search(q, limit=limit)
    return {"query": q, "results": results}

@router.get("/runbooks")
def list_runbooks():
    return {"runbooks": qdrant_svc.list_runbooks()}
