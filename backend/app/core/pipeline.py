import asyncio
import json
import logging

from app.services.redis_service import redis_client
from app.models.isolation_forest import anomaly_detector
from app.services.qdrant_service import qdrant_svc
from app.services.ollama_service import generate_diagnosis
from app.services.webhook_service import dispatch_webhook
from app.routers.incidents import create_incident

logger = logging.getLogger(__name__)

LEVEL_MAP = {"INFO": 0, "WARN": 1, "WARNING": 1, "ERROR": 2, "CRITICAL": 3}
_last_id = "0"  # start from beginning on first boot

def get_broadcasters():
    from app.routers.metrics import metrics_manager
    from app.routers.logs import logs_manager
    return metrics_manager, logs_manager

async def start_pipeline_loop():
    global _last_id
    logger.info("Pipeline loop started...")
    metrics_manager, logs_manager = get_broadcasters()

    while True:
        try:
            entries = await asyncio.to_thread(
                redis_client.client.xread,
                {"inertia:logs": _last_id},
                count=10,
                block=500
            )
            if not entries:
                continue

            for _, messages in entries:
                for msg_id, fields in messages:
                    _last_id = msg_id  # track position
                    log = {k.decode(): v.decode() for k, v in fields.items()}

                    cpu       = float(log.get("cpu", 30.0))
                    ram       = float(log.get("ram", 50.0))
                    latency   = float(log.get("latency_ms", 100.0))
                    level_str = log.get("level", "INFO")
                    level_num = LEVEL_MAP.get(level_str, 0)

                    score, prediction = anomaly_detector.score([cpu, ram, latency, level_num])
                    is_anomalous = (prediction == -1)

                    await metrics_manager.broadcast({
                        "type": "telemetry",
                        "cpu": cpu,
                        "ram": ram,
                        "latency_ms": latency,
                        "anomaly_score": round(score, 4),
                        "timestamp": log.get("timestamp", "")
                    })

                    log_payload = {
                        "type": "log",
                        "timestamp": log.get("timestamp", ""),
                        "level": level_str,
                        "service": log.get("service", "unknown"),
                        "message": log.get("message", ""),
                        "cpu": cpu,
                        "ram": ram,
                        "latency_ms": latency,
                        "isAnomalous": is_anomalous,
                        "anomaly_score": round(score, 4),
                        "request_id": log.get("request_id", "")
                    }

                    if is_anomalous:
                        logger.warning(f"ANOMALY | score={score:.3f} | {level_str} | {log.get('message','')[:80]}")

                        rag_hits = qdrant_svc.semantic_search(log.get("message", ""), limit=3)
                        log["rag_hits"] = rag_hits
                        log["anomaly_score"] = round(score, 4)

                        diagnosis = await generate_diagnosis(log, rag_hits)

                        webhook_result = await dispatch_webhook({
                            **diagnosis,
                            "id": "pending"
                        })

                        incident = create_incident(log, diagnosis, webhook_result)

                        log_payload["diagnosis"] = diagnosis
                        log_payload["rag_hits"] = rag_hits
                        log_payload["incident_id"] = incident["id"]

                        await metrics_manager.broadcast({
                            "type": "incident",
                            "incident": incident
                        })

                        logger.info(f"Incident created: {incident['id']} | {diagnosis.get('incident_signature','')}")

                    await logs_manager.broadcast(log_payload)

        except Exception as e:
            logger.error(f"Pipeline error: {e}", exc_info=True)
            await asyncio.sleep(2)
