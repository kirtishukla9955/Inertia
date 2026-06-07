import uuid
import json
import logging
from datetime import datetime, timezone
from fastapi import APIRouter
from app.services.db_service import get_conn

logger = logging.getLogger(__name__)
router = APIRouter()

def row_to_dict(row):
    if row is None:
        return None
    d = dict(row)
    if d.get("rag_hits"):
        try:
            d["rag_hits"] = json.loads(d["rag_hits"])
        except Exception:
            pass
    if d.get("webhook_payload"):
        try:
            d["webhook_payload"] = json.loads(d["webhook_payload"])
        except Exception:
            pass
    return d

@router.get("")
def list_incidents(page: int = 1, page_size: int = 20, severity: str = None, status: str = None):
    conn = get_conn()
    where_clauses = []
    params = []
    if severity:
        where_clauses.append("severity = ?")
        params.append(severity.upper())
    if status:
        where_clauses.append("status = ?")
        params.append(status)
    where = ("WHERE " + " AND ".join(where_clauses)) if where_clauses else ""
    total = conn.execute(f"SELECT COUNT(*) FROM incidents {where}", params).fetchone()[0]
    offset = (page - 1) * page_size
    rows = conn.execute(
        f"SELECT * FROM incidents {where} ORDER BY timestamp DESC LIMIT ? OFFSET ?",
        params + [page_size, offset]
    ).fetchall()
    conn.close()
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [row_to_dict(r) for r in rows]
    }

@router.get("/stats")
def incident_stats():
    conn = get_conn()
    total = conn.execute("SELECT COUNT(*) FROM incidents").fetchone()[0]
    resolved = conn.execute("SELECT COUNT(*) FROM incidents WHERE status='resolved'").fetchone()[0]
    avg_ttr_row = conn.execute("SELECT AVG(ttr_seconds) FROM incidents WHERE ttr_seconds IS NOT NULL").fetchone()
    avg_ttr = avg_ttr_row[0] if avg_ttr_row[0] else 0
    today = datetime.now(timezone.utc).date().isoformat()
    today_count = conn.execute(
        "SELECT COUNT(*) FROM incidents WHERE timestamp LIKE ?", (f"{today}%",)
    ).fetchone()[0]
    conn.close()
    auto_rate = round((resolved / total * 100), 1) if total > 0 else 0
    return {
        "total": total,
        "resolved": resolved,
        "open": total - resolved,
        "auto_resolved_rate": auto_rate,
        "avg_ttr_seconds": round(avg_ttr, 1),
        "today_count": today_count,
    }

@router.get("/{incident_id}")
def get_incident(incident_id: str):
    conn = get_conn()
    row = conn.execute("SELECT * FROM incidents WHERE id = ?", (incident_id,)).fetchone()
    conn.close()
    if row is None:
        return {"error": "Not found"}
    return row_to_dict(row)

@router.patch("/{incident_id}/resolve")
def resolve_incident(incident_id: str):
    now = datetime.now(timezone.utc).isoformat()
    conn = get_conn()
    row = conn.execute("SELECT timestamp FROM incidents WHERE id = ?", (incident_id,)).fetchone()
    if not row:
        conn.close()
        return {"error": "Not found"}
    try:
        created = datetime.fromisoformat(row["timestamp"].replace("Z", "+00:00"))
        resolved_dt = datetime.fromisoformat(now.replace("Z", "+00:00"))
        ttr = (resolved_dt - created).total_seconds()
    except Exception:
        ttr = None
    conn.execute(
        "UPDATE incidents SET status='resolved', resolution_time=?, ttr_seconds=? WHERE id=?",
        (now, ttr, incident_id)
    )
    conn.commit()
    conn.close()
    return {"id": incident_id, "status": "resolved", "resolution_time": now, "ttr_seconds": ttr}

def create_incident(log_entry: dict, diagnosis: dict, webhook_result: dict = None) -> dict:
    inc_id = f"INC-{str(uuid.uuid4())[:8].upper()}"
    now = log_entry.get("timestamp", datetime.now(timezone.utc).isoformat())
    rag_hits_json = json.dumps(log_entry.get("rag_hits", []))
    webhook_json  = json.dumps(webhook_result or {})
    conn = get_conn()
    conn.execute("""
        INSERT INTO incidents (
            id, timestamp, service, level, message, anomaly_score,
            incident_signature, root_cause_analysis, root_cause,
            severity, affected_service, remediation_action,
            remediation_target, estimated_resolution_seconds,
            confidence, recommended_action, rag_hits, status,
            webhook_payload, webhook_status
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, (
        inc_id,
        now,
        log_entry.get("service", "unknown"),
        log_entry.get("level", "ERROR"),
        log_entry.get("message", ""),
        log_entry.get("anomaly_score", 0.0),
        diagnosis.get("incident_signature", ""),
        diagnosis.get("root_cause_analysis", ""),
        diagnosis.get("root_cause", ""),
        diagnosis.get("severity", "HIGH"),
        diagnosis.get("affected_service", log_entry.get("service", "unknown")),
        diagnosis.get("remediation_action", "manual_intervention"),
        diagnosis.get("remediation_target", "unknown"),
        diagnosis.get("estimated_resolution_time_seconds", 120),
        diagnosis.get("confidence", 0.0),
        diagnosis.get("recommended_action", ""),
        rag_hits_json,
        "open",
        webhook_json,
        webhook_result.get("status", "unknown") if webhook_result else "pending"
    ))
    conn.commit()
    conn.close()
    return {
        "id": inc_id,
        "timestamp": now,
        "service": log_entry.get("service", "unknown"),
        "level": log_entry.get("level", "ERROR"),
        "message": log_entry.get("message", ""),
        "anomaly_score": log_entry.get("anomaly_score", 0.0),
        "incident_signature": diagnosis.get("incident_signature", ""),
        "root_cause_analysis": diagnosis.get("root_cause_analysis", ""),
        "root_cause": diagnosis.get("root_cause", ""),
        "severity": diagnosis.get("severity", "HIGH"),
        "affected_service": diagnosis.get("affected_service", ""),
        "remediation_action": diagnosis.get("remediation_action", ""),
        "remediation_target": diagnosis.get("remediation_target", ""),
        "estimated_resolution_seconds": diagnosis.get("estimated_resolution_time_seconds", 120),
        "confidence": diagnosis.get("confidence", 0.0),
        "recommended_action": diagnosis.get("recommended_action", ""),
        "rag_hits": log_entry.get("rag_hits", []),
        "status": "open",
        "webhook_payload": webhook_result or {},
        "webhook_status": webhook_result.get("status", "pending") if webhook_result else "pending"
    }
