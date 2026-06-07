import hmac
import hashlib
import json
import logging
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

WHITELIST = {
    "restart_service":    "docker restart {target}",
    "kill_process":       "kill -9 $(lsof -t -i:{target})",
    "clear_cache":        "redis-cli FLUSHDB",
    "scale_container":    "docker-compose scale {target}=2",
    "flush_connections":  "pg_terminate_backend SELECT pid FROM pg_stat_activity WHERE state='idle'",
    "manual_intervention": None,
}

def generate_hmac(payload: str) -> str:
    return hmac.new(
        settings.WEBHOOK_SECRET.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()

async def dispatch_webhook(incident: dict) -> dict:
    action = incident.get("remediation_action", "manual_intervention")
    target = incident.get("remediation_target", "unknown")

    if action not in WHITELIST:
        return {"status": "rejected", "reason": f"Action '{action}' not in whitelist"}

    if action == "manual_intervention":
        return {"status": "skipped", "reason": "Manual intervention flagged — engineer notified"}

    payload = {
        "incident_id": incident.get("id"),
        "action": action,
        "target": target,
        "incident_signature": incident.get("incident_signature", ""),
        "severity": incident.get("severity", "HIGH"),
    }
    payload_str = json.dumps(payload)
    signature = generate_hmac(payload_str)

    logger.info(f"Webhook dispatch: action={action} target={target} incident={incident.get('id')}")
    return {
        "status": "dispatched",
        "action": action,
        "target": target,
        "signature": f"sha256={signature[:16]}****",
        "payload": payload
    }
