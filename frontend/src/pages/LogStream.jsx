import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Pause, Play, Download, Filter } from 'lucide-react'
import { useWebSocket } from '../hooks/useWebSocket'
import SeverityBadge from '../components/shared/SeverityBadge'
import ForensicDrawer from '../components/drawers/ForensicDrawer'
import { cn } from '../lib/utils'

const MAX_LOGS = 1000

const LEVEL_COLOR = {
  INFO:     'text-[#aaa]',
  WARN:     'text-[var(--accent-amber)]',
  WARNING:  'text-[var(--accent-amber)]',
  ERROR:    'text-[var(--accent-red)]',
  CRITICAL: 'text-[var(--accent-red)] font-bold',
}

export default function LogStream() {
  const [logs, setLogs]         = useState([])
  const [paused, setPaused]     = useState(false)
  const [filter, setFilter]     = useState({ level: '', service: '', keyword: '' })
  const [selected, setSelected] = useState(null)
  const [services, setServices] = useState([])
  const bottomRef = useRef(null)
  const pausedRef = useRef(false)
  const logsRef   = useRef([])
  pausedRef.current = paused

  const handleLog = useCallback((msg) => {
    if (msg.type !== 'log' || pausedRef.current) return
    logsRef.current = [...logsRef.current.slice(-(MAX_LOGS - 1)), { ...msg, _id: Date.now() + Math.random() }]
    setLogs([...logsRef.current])
    setServices(prev => {
      if (msg.service && !prev.includes(msg.service)) return [...prev, msg.service]
      return prev
    })
  }, [])

  useWebSocket('/api/logs/ws', handleLog)

  useEffect(() => {
    if (!paused) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, paused])

  const filtered = logs.filter(l => {
    if (filter.level   && l.level !== filter.level) return false
    if (filter.service && l.service !== filter.service) return false
    if (filter.keyword && !l.message?.toLowerCase().includes(filter.keyword.toLowerCase())) return false
    return true
  })

  const handleExport = () => {
    const text = filtered.map(l =>
      `${l.timestamp} [${l.level}] [${l.service}] ${l.message}`
    ).join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `inertia-logs-${Date.now()}.log`; a.click()
  }

  return (
    <div className="h-full flex flex-col p-5 gap-4">
      {/* Filter bar */}
      <div className="panel p-3 flex flex-wrap items-center gap-3 shrink-0">
        <div className="flex items-center gap-2 text-[#666680]">
          <Filter size={14} />
          <span className="text-xs font-semibold">Filters</span>
        </div>

        <select
          value={filter.level}
          onChange={e => setFilter(f => ({ ...f, level: e.target.value }))}
          className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded px-2 py-1 text-xs text-white"
        >
          <option value="">All Levels</option>
          {['INFO','WARN','ERROR','CRITICAL'].map(l => <option key={l} value={l}>{l}</option>)}
        </select>

        <select
          value={filter.service}
          onChange={e => setFilter(f => ({ ...f, service: e.target.value }))}
          className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded px-2 py-1 text-xs text-white"
        >
          <option value="">All Services</option>
          {services.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <div className="flex items-center gap-1.5 flex-1 min-w-[160px] max-w-xs bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded px-2 py-1">
          <Search size={12} className="text-[#666680]" />
          <input
            type="text"
            placeholder="Search messages..."
            value={filter.keyword}
            onChange={e => setFilter(f => ({ ...f, keyword: e.target.value }))}
            className="bg-transparent text-xs text-white placeholder-[#444460] outline-none flex-1"
          />
        </div>

        <button
          onClick={() => setFilter({ level: '', service: '', keyword: '' })}
          className="btn text-xs"
        >Clear</button>

        <div className="flex items-center gap-2 ml-auto">
          {paused && <span className="badge badge-amber animate-pulse">PAUSED</span>}
          <button onClick={() => setPaused(p => !p)} className={cn("btn", paused ? "btn-cyan" : "")}>
            {paused ? <Play size={12} /> : <Pause size={12} />}
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button onClick={handleExport} className="btn">
            <Download size={12} /> Export
          </button>
        </div>
      </div>

      {/* Log lines */}
      <div className="panel panel-scan flex-1 min-h-0 overflow-y-auto scrollbar-thin p-0">
        <div className="font-mono text-[11px] leading-relaxed">
          {filtered.map((log, i) => (
            <div
              key={log._id || i}
              onClick={() => log.isAnomalous && log.incident_id && setSelected(log)}
              className={cn(
                "flex items-start gap-3 px-4 py-1.5 border-b border-[rgba(255,255,255,0.03)] transition-colors",
                log.isAnomalous
                  ? "bg-[rgba(255,59,59,0.06)] border-l-4 border-l-[var(--accent-red)] cursor-pointer hover:bg-[rgba(255,59,59,0.1)]"
                  : "hover:bg-[rgba(255,255,255,0.02)]"
              )}
            >
              <span className="text-[#333350] shrink-0 tabular-nums w-20">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span className="shrink-0 w-16">
                <SeverityBadge severity={log.level} />
              </span>
              <span className="text-[var(--accent-cyan)] shrink-0 w-24 truncate">[{log.service}]</span>
              <span className={cn("flex-1 break-all", LEVEL_COLOR[log.level] || 'text-[#ccc]')}>
                {log.message}
              </span>
              {log.isAnomalous && (
                <span className="badge badge-red shrink-0">ANOMALY</span>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {selected && (
        <ForensicDrawer
          incident={{ ...selected, id: selected.incident_id, level: selected.level }}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
