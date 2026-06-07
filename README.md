# Inertia — Autonomous DevOps Observability & Self-Healing Platform

> Real-time anomaly detection, AI-powered root cause analysis, and autonomous remediation — all on-device, zero cloud dependency.

```
[ SIMULATOR ] ──> [ REDIS STREAMS ] ──> [ ISOLATION FOREST ]
                                                  │
                                          Anomaly Detected?
                                                  │ YES
                                         [ QDRANT RAG SEARCH ]
                                                  │
                                         [ OLLAMA LLM DIAGNOSIS ]
                                                  │
                                    [ HMAC WEBHOOK DISPATCH ]
                                                  │
                                     [ AUTONOMOUS REMEDIATION ]
                                                  │
                                       [ SQLITE PERSISTENCE ]
                                                  │
                                    [ REACT DASHBOARD via WS ]
```

## Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + Tailwind + Recharts |
| Backend | FastAPI (Python 3.12) |
| Queue | Redis Streams |
| ML | Scikit-learn Isolation Forest |
| Vector DB | Qdrant |
| LLM | Ollama (Llama 3.2) |
| Persistence | SQLite |
| Container | Docker Compose |

## Quick Start

**Prerequisites:** Docker, Docker Compose, 8GB RAM minimum

```bash
git clone <repo>
cd Inertia
cp .env.example .env
docker compose up --build
```

Open **http://localhost:3000**

> **First boot note:** Ollama pulls Llama 3.2 (~2GB) on first start. This takes a few minutes. The API will start once the model is ready. Subsequent starts are instant.

## How It Works

1. **Simulator** generates realistic application traffic with periodic injected failures (DB exhaustion, memory leaks, CPU spikes, network cascades)
2. **FastAPI pipeline** consumes from Redis Streams continuously
3. **Isolation Forest** scores each event — returns `-1` for anomalies
4. On anomaly: **Qdrant** retrieves similar historical runbooks via cosine similarity
5. **Ollama** (Llama 3.2 local) generates a structured 7-field JSON diagnosis
6. **Webhook dispatcher** fires an HMAC SHA-256 signed payload to the remediation engine
7. Incident is **persisted to SQLite** with full forensic data
8. **React dashboard** receives all events in real-time via WebSocket

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `REDIS_URL` | `redis://inertia-redis:6379` | Redis connection |
| `QDRANT_HOST` | `inertia-qdrant` | Qdrant host |
| `QDRANT_PORT` | `6333` | Qdrant port |
| `OLLAMA_URL` | `http://inertia-ollama:11434` | Ollama endpoint |
| `OLLAMA_MODEL` | `llama3.2` | Model to use |
| `WEBHOOK_SECRET` | (required) | HMAC signing secret |
| `IF_CONTAMINATION` | `0.05` | Isolation Forest contamination rate |
| `IF_N_ESTIMATORS` | `100` | Number of trees |

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| WS | `/api/metrics/ws` | Live telemetry stream |
| WS | `/api/logs/ws` | Live log stream |
| GET | `/api/incidents` | Paginated incident history |
| GET | `/api/incidents/stats` | Aggregate statistics |
| GET | `/api/incidents/{id}` | Full incident detail |
| PATCH | `/api/incidents/{id}/resolve` | Mark resolved |
| GET | `/api/health` | All service statuses |
| GET | `/api/rag/search?q=` | Semantic knowledge base search |
| GET | `/api/rag/runbooks` | List all runbooks |
| GET | `/api/actions` | Whitelist registry |
| POST | `/api/actions` | Add new action |
| GET | `/api/settings` | Current config |
| POST | `/api/settings` | Update config |
