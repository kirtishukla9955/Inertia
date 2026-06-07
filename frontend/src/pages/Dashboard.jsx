import React, { useState, useEffect, useRef, useCallback } from 'react'
import KPICards from '../components/dashboard/KPICards'
import TelemetryChart from '../components/dashboard/TelemetryChart'
import IsolationForestGauge from '../components/dashboard/IsolationForestGauge'
import ActiveIncidents from '../components/dashboard/ActiveIncidents'
import HealingQueue from '../components/dashboard/HealingQueue'
import ForensicDrawer from '../components/drawers/ForensicDrawer'
import { useWebSocket } from '../hooks/useWebSocket'
import { API } from '../lib/utils'

const MAX_CHART_POINTS = 60

export default function Dashboard({ onSystemStatus, onIncidentCount }) {
  const [telemetry, setTelemetry]   = useState([])
  const [score, setScore]           = useState(0.8)
  const [incidents, setIncidents]   = useState([])
  const [selected, setSelected]     = useState(null)
  const [flash, setFlash]           = useState(false)
  const [stats, setStats]           = useState({ anomaliesToday: 0, selfHealed: 0, autoRate: 0, health: 100, mttr: '—' })
  const telRef = useRef([])

  // Load initial incidents
  useEffect(() => {
    fetch(`${API}/api/incidents?page_size=20`)
      .then(r => r.json())
      .then(data => { if (data.items) setIncidents(data.items) })
      .catch(() => {})

    fetch(`${API}/api/incidents/stats`)
      .then(r => r.json())
      .then(data => {
        setStats({
          anomaliesToday: data.today_count || 0,
          selfHealed:     data.resolved || 0,
          autoRate:       data.auto_resolved_rate || 0,
          health:         Math.max(0, 100 - (data.open || 0) * 5),
          mttr:           data.avg_ttr_seconds > 0
            ? `${Math.floor(data.avg_ttr_seconds / 60)}m ${Math.round(data.avg_ttr_seconds % 60)}s`
            : '—',
        })
      })
      .catch(() => {})
  }, [])

  const handleMetric = useCallback((msg) => {
    if (msg.type === 'telemetry') {
      const point = {
        time:    new Date(msg.timestamp).toLocaleTimeString(),
        cpu:     msg.cpu,
        ram:     msg.ram,
        latency: msg.latency_ms / 10,
      }
      telRef.current = [...telRef.current.slice(-(MAX_CHART_POINTS - 1)), point]
      setTelemetry([...telRef.current])
      setScore(msg.anomaly_score ?? 0.8)

      const health = Math.max(0, 100 - Math.max(0, msg.cpu - 70) - Math.max(0, msg.ram - 70))
      setStats(s => ({ ...s, health }))
    }

    if (msg.type === 'incident') {
      const inc = msg.incident
      // Trigger viewport flash
      setFlash(true)
      setTimeout(() => setFlash(false), 650)

      setIncidents(prev => {
        const updated = [inc, ...prev.filter(i => i.id !== inc.id)]
        onIncidentCount?.(updated.filter(i => i.status === 'open').length)
        return updated
      })
      setStats(s => ({ ...s, anomaliesToday: s.anomaliesToday + 1 }))
      onSystemStatus?.('incident')
      setTimeout(() => onSystemStatus?.('nominal'), 30000)
      setSelected(inc)
    }
  }, [onSystemStatus, onIncidentCount])

  const { connected } = useWebSocket('/api/metrics/ws', handleMetric)

  const cpuHistory = telemetry.map(t => t.cpu)

  return (
    <div className="relative h-full flex flex-col gap-4 p-5 overflow-y-auto scrollbar-thin">
      {/* Anomaly edge flash */}
      {flash && (
        <div className="fixed inset-0 z-[100] pointer-events-none animate-edge-flash rounded-none"
          style={{ boxShadow: 'inset 0 0 0 3px rgba(255,59,59,0.9), inset 0 0 60px rgba(255,59,59,0.3)' }}
        />
      )}

      <KPICards kpis={stats} cpuHistory={cpuHistory} />

      <div className="grid grid-cols-12 gap-4 flex-1 min-h-0" style={{ minHeight: 380 }}>
        {/* Telemetry chart — 5 cols */}
        <div className="col-span-12 lg:col-span-5 min-h-0">
          <TelemetryChart data={telemetry} connected={connected} />
        </div>

        {/* Center column — gauge + incidents — 4 cols */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 min-h-0">
          <IsolationForestGauge score={score} />
          <div className="flex-1 min-h-0">
            <ActiveIncidents incidents={incidents} onSelect={setSelected} />
          </div>
        </div>

        {/* Right column — healing queue — 3 cols */}
        <div className="col-span-12 lg:col-span-3 min-h-0">
          <HealingQueue incidents={incidents} />
        </div>
      </div>

      {selected && (
        <ForensicDrawer incident={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
