import sqlite3
import os
import logging
from app.config import settings

logger = logging.getLogger(__name__)

def get_conn():
    os.makedirs(os.path.dirname(settings.DB_PATH), exist_ok=True)
    conn = sqlite3.connect(settings.DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_conn()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS incidents (
            id TEXT PRIMARY KEY,
            timestamp TEXT NOT NULL,
            service TEXT,
            level TEXT,
            message TEXT,
            anomaly_score REAL,
            incident_signature TEXT,
            root_cause_analysis TEXT,
            root_cause TEXT,
            severity TEXT,
            affected_service TEXT,
            remediation_action TEXT,
            remediation_target TEXT,
            estimated_resolution_seconds INTEGER,
            confidence REAL,
            recommended_action TEXT,
            rag_hits TEXT,
            status TEXT DEFAULT 'open',
            resolution_time TEXT,
            ttr_seconds REAL,
            webhook_payload TEXT,
            webhook_status TEXT
        )
    """)
    conn.commit()
    conn.close()
    logger.info("SQLite DB initialized.")
