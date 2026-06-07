from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.services.webhook_service import WHITELIST

router = APIRouter()

_actions = [
    {"id": "ACT-001", "name": "Restart DB Pool", "command_type": "restart_service", "target": "db-pool", "risk_level": "LOW", "enabled": True, "times_executed": 0},
    {"id": "ACT-002", "name": "Kill Zombie Connections", "command_type": "flush_connections", "target": "5432", "risk_level": "MEDIUM", "enabled": True, "times_executed": 0},
    {"id": "ACT-003", "name": "Clear Redis Cache", "command_type": "clear_cache", "target": "cache-layer", "risk_level": "LOW", "enabled": True, "times_executed": 0},
    {"id": "ACT-004", "name": "Restart API Server", "command_type": "restart_service", "target": "api-server", "risk_level": "MEDIUM", "enabled": True, "times_executed": 0},
    {"id": "ACT-005", "name": "Scale API Server", "command_type": "scale_container", "target": "api-server", "risk_level": "LOW", "enabled": True, "times_executed": 0},
    {"id": "ACT-006", "name": "Restart Worker", "command_type": "restart_service", "target": "worker", "risk_level": "LOW", "enabled": True, "times_executed": 0},
]

class ActionCreate(BaseModel):
    name: str
    command_type: str
    target: str
    risk_level: str = "LOW"
    requires_approval: bool = False

@router.get("")
def list_actions():
    return {"actions": _actions, "whitelist": list(WHITELIST.keys())}

@router.post("")
def create_action(body: ActionCreate):
    import uuid
    new_action = {
        "id": f"ACT-{str(uuid.uuid4())[:6].upper()}",
        "name": body.name,
        "command_type": body.command_type,
        "target": body.target,
        "risk_level": body.risk_level,
        "enabled": True,
        "times_executed": 0,
        "requires_approval": body.requires_approval,
    }
    _actions.append(new_action)
    return new_action
