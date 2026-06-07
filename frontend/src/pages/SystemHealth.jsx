import React, { useState, useEffect } from 'react'
import { Activity } from 'lucide-react'
import { cn } from '../lib/utils'
import { API } from '../lib/utils'

const SERVICES = [
  { key: 'api_server',       label: 'API Server',       icon: '⚡' },
  { key: 'redis_stream',     label: 'Redis Stream',     icon: '🔄' },
  { key: 'qdrant_vector_db', label: 'Qdrant Vector DB', icon: '🧠' },
  { key: 'isolation_forest', label: 'Isolation Forest', icon: '🌲' },
  { key: 'ollama_llm',       label: 'Ollama LLM',       icon: '🤖' },
  { key: 'webhook_hub',      label: 'Webhook Hub',      icon: '🔗' },
]

const PIPELINE = [
  { label: 'Ingestion',    sub: 'Redis Streams' },
  { label: 'Detection',    sub: 'Isolation Forest' },
  { label: 'Diagnosis',    sub: 'Ollama + RAG' },
  { label: 'Remediation',  sub: 'Webhook + MCP' },
]

function StatusColor(status) {
  if (status === 'UP')       return { text: 'text-[var(--accent-green)]', border: 'border-[rgba(0,255,148,0.25)]', bg: 'bg-[rgba(0,255,148,0.07)]', dot: 'bg-[var(--accent-green)] shadow-[0_0_8px_var(--accent-green)]' }
  if (status === 'DEGRADED') return { text: 'text-[var(--accent-amber)]', border: 'border-[rgba(255,184,0,0.25)]',  bg: 'bg-[rgba(255,184,0,0.07)]',  dot: 'bg-[var(--accent-amber)] shadow-[0_0_8px_var(--accent-amber)]' }
  return                             { text: 'text-[var(--accent-red)]',   border: 'border-[rgba(255,59,59,0.25)]',  bg: 'bg-[rgba(255,59,59,0.07)]',  dot: 'bg-[var(--accent-red)] shadow-[0_0_8px_var(--accent-red)]' }
}

export default function SystemHealth() {
  const [health, setHealth] = useState(null)
  const [uptime, setUptime] = useState({})

  useEffect(() => {
    const load = () => {
      fetch(`${API}/api/health`).then(r => r.json()).then(d => {
        setHealth(d)
        setUptime(d)
      }).catch(() => {})
    }
    load()
    const t = setInterval(load, 5000)
    return () => clearInterval(t)
  }, [])

  const services = health?.services || {}
  const allUp = Object.values(services).every(s => s.status === 'UP')

  return (
    <div className="h-full flex flex-col p-5 gap-5 overflow-y-auto scrollbar-thin">
      {/* Overall status */}
      <div className="panel p-4 flex items-center gap-4">
        <Activity size={20} className={allUp ? 'text-[var(--accent-green)]' : 'text-[var(--accent-amber)]'} />
        <div>
          <div className={`text-lg font-bold font-mono ${allUp ? 'text-[var(--accent-green)]' : 'text-[var(--accent-amber)]'}`}>
            {allUp ? 'ALL SYSTEMS OPERATIONAL' : 'DEGRADED PERFORMANCE'}
          </div>
          <div className="text-xs text-[#666680]">Uptime: {health?.uptime || '—'}</div>
        </div>
      </div>

      {/* Service cards grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {SERVICES.map(({ key, label, icon }) => {
          const svc = services[key] || { status: 'UNKNOWN', latency_ms: null }
          const c = StatusColor(svc.status)
          return (
            <div key={key} className={cn("panel p-5 flex flex-col gap-3 border", c.border, c.bg)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{icon}</span>
                  <span className="text-sm font-semibold text-white">{label}</span>
                </div>
                <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", c.dot)} />
              </div>
              <div className="flex items-center justify-between">
                <span className={cn("font-mono text-sm font-bold", c.text)}>{svc.status}</span>
                <span className="font-mono text-xs text-[#666680]">
                  {svc.latency_ms != null ? `${svc.latency_ms}ms` : '—'}
                </span>
              </div>
              {svc.error && (
                <p className="text-[10px] text-[var(--accent-red)] font-mono truncate">{svc.error}</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Pipeline flow diagram */}
      <div className="panel p-5 flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-white">Pipeline Health</h3>
        <div className="flex items-center gap-0">
          {PIPELINE.map((stage, i) => (
            <React.Fragment key={stage.label}>
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className={cn(
                  "w-full max-w-[120px] rounded-lg p-3 border text-center",
                  allUp
                    ? "border-[rgba(0,240,255,0.3)] bg-[rgba(0,240,255,0.06)]"
                    : "border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)]"
                )}>
                  <div className={cn("text-xs font-bold", allUp ? "text-[var(--accent-cyan)]" : "text-[#666680]")}>
                    {stage.label}
                  </div>
                  <div className="text-[10px] text-[#444460] mt-0.5">{stage.sub}</div>
                </div>
              </div>
              {i < PIPELINE.length - 1 && (
                <div className="relative flex-shrink-0 w-8 flex items-center justify-center" style={{ height: 40 }}>
                  <div className="w-full h-px bg-[rgba(255,255,255,0.1)]" />
                  {allUp && <div className="flow-dot" style={{ animationDelay: `${i * 0.5}s` }} />}
                  <span className="absolute text-[#333350] text-xs">→</span>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}
