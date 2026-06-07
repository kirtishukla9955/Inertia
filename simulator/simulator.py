import redis
import time
import random
import uuid
import json
import os
from datetime import datetime, timezone

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379")
STREAM    = "inertia:logs"

SERVICES = ["api-server", "db-pool", "cache-layer", "auth-service", "gateway", "worker"]

def ts():
    return datetime.now(timezone.utc).isoformat()

def push(r, service, level, message, cpu, ram, latency):
    entry = {
        "timestamp":  ts(),
        "level":      level,
        "service":    service,
        "message":    message,
        "cpu":        str(round(cpu, 2)),
        "ram":        str(round(ram, 2)),
        "latency_ms": str(round(latency, 2)),
        "request_id": str(uuid.uuid4())
    }
    r.xadd(STREAM, {k: v.encode() for k, v in entry.items()})
    print(f"[{level}] {service}: {message[:80]}")

def normal_traffic(r):
    svc     = random.choice(SERVICES)
    cpu     = random.uniform(20, 60)
    ram     = random.uniform(30, 65)
    latency = random.uniform(50, 200)
    levels  = ["INFO"] * 18 + ["WARN"] * 2
    level   = random.choice(levels)
    msgs = {
        "INFO":  [
            "Request processed successfully",
            f"GET /api/v1/data → 200 in {latency:.0f}ms",
            "Health check passed",
            "Connection pool: 12/50 active",
            "Cache hit ratio: 94.2%",
            "JWT validated successfully",
            "Scheduled job completed",
        ],
        "WARN": [
            f"Slow query detected: {latency:.0f}ms",
            "Cache eviction rate elevated",
            "Connection pool 65% utilized",
            f"Response time elevated: {latency:.0f}ms",
        ]
    }
    push(r, svc, level, random.choice(msgs[level]), cpu, ram, latency)

def scenario_db_exhaustion(r, elapsed, total=90):
    cpu     = random.uniform(75, 92)
    ram     = 88 + (elapsed / total) * 7 + random.uniform(0, 3)
    latency = 800 + elapsed * 13 + random.uniform(0, 400)
    msgs = [
        "ERROR: connection pool exhausted at port 5432",
        "FATAL: too many connections (max_connections=100 reached)",
        "CRITICAL: DB unreachable — all connections in use",
        "ERROR: unable to acquire connection from pool after 5000ms",
        "CRITICAL: PostgreSQL refusing new connections",
    ]
    level = "CRITICAL" if elapsed > total * 0.5 else "ERROR"
    push(r, "db-pool", level, random.choice(msgs), cpu, ram, latency)

def scenario_memory_leak(r, elapsed, total=180):
    cpu      = 65 + (elapsed / total) * 20 + random.uniform(0, 5)
    ram      = 65 + (elapsed / total) * 29 + random.uniform(0, 3)
    latency  = 100 + (elapsed / total) * 400 + random.uniform(0, 50)
    msgs = [
        f"WARN: heap usage {ram:.0f}% — GC pressure building",
        "ERROR: GC overhead limit exceeded — heap nearly full",
        "CRITICAL: OutOfMemoryError: Java heap space",
        f"ERROR: memory allocation failed — RSS at {ram:.0f}%",
        "CRITICAL: worker process OOM-killed",
    ]
    level = "CRITICAL" if ram > 88 else "ERROR" if ram > 78 else "WARN"
    push(r, "worker", level, random.choice(msgs), cpu, ram, latency)

def scenario_cpu_spike(r, elapsed, total=60):
    cpu      = 92 + random.uniform(0, 6)
    ram      = random.uniform(50, 70)
    latency  = 500 + random.uniform(0, 700)
    msgs = [
        f"WARN: high CPU utilization detected: {cpu:.0f}%",
        f"ERROR: request timeout after 5000ms — CPU at {cpu:.0f}%",
        "CRITICAL: service degraded — runaway process detected",
        f"ERROR: load average: {cpu/25:.2f} — threshold exceeded",
        "CRITICAL: api-server unresponsive — killing and restarting",
    ]
    level = "CRITICAL" if cpu > 96 else "ERROR"
    push(r, "api-server", level, random.choice(msgs), cpu, ram, latency)

def scenario_network_cascade(r, elapsed, total=120):
    cpu      = random.uniform(40, 65)
    ram      = random.uniform(45, 70)
    latency  = 3000 + elapsed * 40 + random.uniform(0, 1000)
    msgs = [
        f"ERROR: upstream timeout after {latency:.0f}ms",
        "CRITICAL: circuit breaker OPEN — upstream unreachable",
        "ERROR: service mesh failure — all upstream hosts DOWN",
        f"CRITICAL: {latency/1000:.1f}s response time — SLA breached",
        "ERROR: retry budget exhausted on gateway",
    ]
    level = "CRITICAL" if elapsed > total * 0.4 else "ERROR"
    push(r, "gateway", level, random.choice(msgs), cpu, ram, latency)

def main():
    print(f"[Inertia Simulator] Connecting to Redis at {REDIS_URL}...")
    r = None
    while r is None:
        try:
            r = redis.from_url(REDIS_URL, decode_responses=False)
            r.ping()
            print("[Inertia Simulator] Connected. Starting traffic simulation...")
        except Exception as e:
            print(f"[Inertia Simulator] Redis not ready: {e}. Retrying in 3s...")
            time.sleep(3)
            r = None

    scenario_interval = random.randint(120, 240)
    scenario_start    = None
    scenario_type     = None
    scenario_total    = 90

    i = 0
    while True:
        now = time.time()

        # Check if it's time for a new scenario
        if scenario_start is None and i > 0 and i % scenario_interval == 0:
            scenario_type  = random.choice(['db', 'memory', 'cpu', 'network'])
            scenario_start = now
            scenario_total = {'db': 90, 'memory': 180, 'cpu': 60, 'network': 120}[scenario_type]
            print(f"\n[SCENARIO] Injecting failure: {scenario_type.upper()} — duration ~{scenario_total}s\n")

        # Run scenario or normal traffic
        if scenario_start is not None:
            elapsed = now - scenario_start
            if elapsed < scenario_total:
                if   scenario_type == 'db':      scenario_db_exhaustion(r, elapsed, scenario_total)
                elif scenario_type == 'memory':  scenario_memory_leak(r, elapsed, scenario_total)
                elif scenario_type == 'cpu':     scenario_cpu_spike(r, elapsed, scenario_total)
                elif scenario_type == 'network': scenario_network_cascade(r, elapsed, scenario_total)
                # Also push some normal traffic during scenario
                if random.random() < 0.3:
                    normal_traffic(r)
            else:
                print(f"\n[SCENARIO] {scenario_type.upper()} scenario ended.\n")
                scenario_start    = None
                scenario_type     = None
                scenario_interval = random.randint(120, 240)
        else:
            normal_traffic(r)

        time.sleep(random.uniform(0.2, 0.6))
        i += 1

if __name__ == "__main__":
    main()
