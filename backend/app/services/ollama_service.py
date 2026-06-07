import httpx
import json
import logging
from app.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a senior Principal Site Reliability Engineer running inside 
the Inertia autonomous observability platform. You will be given a context window of 
system logs and infrastructure metrics from the 60 seconds surrounding a detected anomaly, 
plus similar historical incidents for reference.
You must output ONLY a valid JSON object with no markdown fences, no conversational text, 
no explanation outside the JSON. Strictly follow this schema:
{
  "incident_signature": "short classification string e.g. DB_CONNECTION_EXHAUSTION",
  "root_cause_analysis": "detailed technical explanation in 3-5 sentences",
  "severity": "one of: LOW | MEDIUM | HIGH | CRITICAL",
  "affected_service": "the service name that is failing",
  "remediation_action": "one of: restart_service | kill_process | clear_cache | scale_container | flush_connections | manual_intervention",
  "remediation_target": "the exact target e.g. db-pool or port 5432",
  "estimated_resolution_time_seconds": 45
}"""

async def generate_diagnosis(log_entry: dict, context_hits: list) -> dict:
    rag_context = ""
    for idx, hit in enumerate(context_hits):
        payload = hit.get("payload", {})
        rag_context += f"{idx+1}. Title: {payload.get('title','')}\n   Content: {payload.get('content','')}\n   Action: {payload.get('action','')}\n\n"

    user_prompt = f"""Analyze this anomalous system event and produce a diagnosis.

[ANOMALOUS LOG]
Service: {log_entry.get('service', 'unknown')}
Level: {log_entry.get('level', 'ERROR')}
Message: {log_entry.get('message', '')}

[SYSTEM METRICS AT TIME OF ANOMALY]
CPU: {log_entry.get('cpu', 'N/A')}%
RAM: {log_entry.get('ram', 'N/A')}%
Network Latency: {log_entry.get('latency_ms', 'N/A')}ms
Anomaly Score: {log_entry.get('anomaly_score', 'N/A')}

[SIMILAR HISTORICAL INCIDENTS FROM KNOWLEDGE BASE]
{rag_context if rag_context else 'No similar incidents found.'}

Output ONLY the JSON object, nothing else."""

    try:
        # Use 300s timeout to give CPU inference enough time to load + respond
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.OLLAMA_URL}/api/chat",
                json={
                    "model": settings.OLLAMA_MODEL,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": user_prompt}
                    ],
                    "stream": False,
                    "format": "json",
                    "options": {
                        "temperature": 0.1,
                        "num_predict": 300,
                    }
                },
                timeout=300.0  # 5 minutes — needed for CPU model load + inference
            )
            response.raise_for_status()
            data = response.json()
            content = data.get("message", {}).get("content", "{}")
            result = json.loads(content)
            result.setdefault("incident_signature", "UNKNOWN_ANOMALY")
            result.setdefault("root_cause_analysis", "Analysis unavailable")
            result.setdefault("severity", "HIGH")
            result.setdefault("affected_service", log_entry.get("service", "unknown"))
            result.setdefault("remediation_action", "manual_intervention")
            result.setdefault("remediation_target", "unknown")
            result.setdefault("estimated_resolution_time_seconds", 120)
            result["root_cause"] = result["root_cause_analysis"]
            result["confidence"] = 0.92
            result["recommended_action"] = result["remediation_action"]
            logger.info(f"Ollama diagnosis: {result.get('incident_signature')} | {result.get('severity')}")
            return result
    except Exception as e:
        logger.error(f"Ollama diagnosis failed: {e}")
        return {
            "incident_signature": "LLM_UNAVAILABLE",
            "root_cause_analysis": f"LLM diagnosis failed: {str(e)[:200]}",
            "root_cause": f"LLM diagnosis failed: {str(e)[:200]}",
            "severity": "HIGH",
            "affected_service": log_entry.get("service", "unknown"),
            "remediation_action": "manual_intervention",
            "remediation_target": "unknown",
            "estimated_resolution_time_seconds": 300,
            "confidence": 0.0,
            "recommended_action": "Manual intervention required"
        }
