import React from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { cn } from '../../lib/utils'

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="panel px-3 py-2 text-xs font-mono">
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[#666680]">{p.name}:</span>
          <span className="text-white">{Number(p.value).toFixed(1)}{p.dataKey === 'latency' ? 'ms' : '%'}</span>
        </div>
      ))}
    </div>
  )
}

export default function TelemetryChart({ data, connected }) {
  return (
    <div className="panel panel-scan flex flex-col h-full">
      <div className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
        <h3 className="text-sm font-semibold text-white tracking-wide">Live Telemetry</h3>
        <div className={cn(
          "flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded border",
          connected
            ? "border-[rgba(0,255,148,0.3)] text-[var(--accent-green)] bg-[rgba(0,255,148,0.06)]"
            : "border-[rgba(255,59,59,0.3)] text-[var(--accent-red)] bg-[rgba(255,59,59,0.06)]"
        )}>
          <div className={cn("w-1.5 h-1.5 rounded-full", connected ? "bg-[var(--accent-green)] animate-glow-pulse" : "bg-[var(--accent-red)]")} />
          {connected ? 'LIVE' : 'RECONNECTING'}
        </div>
      </div>

      <div className="flex-1 min-h-0 px-2 pb-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <XAxis dataKey="time" hide />
            <YAxis domain={[0, 110]} tick={{ fill: '#444460', fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 10, color: '#666680', paddingTop: 4 }}
              iconType="circle" iconSize={6}
            />
            <Line
              type="monotoneX" dataKey="cpu" name="CPU %"
              stroke="#00F0FF" strokeWidth={1.5} dot={false}
              isAnimationActive={false}
              style={{ filter: 'drop-shadow(0 0 4px rgba(0,240,255,0.5))' }}
            />
            <Line
              type="monotoneX" dataKey="ram" name="RAM %"
              stroke="#FFB800" strokeWidth={1.5} dot={false}
              isAnimationActive={false}
              style={{ filter: 'drop-shadow(0 0 4px rgba(255,184,0,0.5))' }}
            />
            <Line
              type="monotoneX" dataKey="latency" name="Latency/10"
              stroke="#00FF94" strokeWidth={1.5} dot={false}
              isAnimationActive={false}
              style={{ filter: 'drop-shadow(0 0 4px rgba(0,255,148,0.5))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
