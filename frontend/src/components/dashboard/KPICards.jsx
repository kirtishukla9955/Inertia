import React from 'react'
import { TrendingDown, TrendingUp, Minus } from 'lucide-react'
import AnimatedNumber from '../shared/AnimatedNumber'
import LiveSparkline from '../shared/LiveSparkline'

function KPICard({ title, value, sub, color, sparkData, trend }) {
  const colorMap = {
    cyan:  { text: 'text-[var(--accent-cyan)]',  glow: 'rgba(0,240,255,0.15)' },
    green: { text: 'text-[var(--accent-green)]', glow: 'rgba(0,255,148,0.15)' },
    amber: { text: 'text-[var(--accent-amber)]', glow: 'rgba(255,184,0,0.15)' },
    red:   { text: 'text-[var(--accent-red)]',   glow: 'rgba(255,59,59,0.15)' },
  }
  const c = colorMap[color] || colorMap.cyan

  return (
    <div className="panel panel-scan p-5 flex flex-col gap-3 flex-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-[#666680] uppercase tracking-[0.1em]">{title}</span>
        {trend === 'up'   && <TrendingUp   size={14} className="text-[var(--accent-green)]" />}
        {trend === 'down' && <TrendingDown size={14} className="text-[var(--accent-red)]"   />}
        {trend === 'flat' && <Minus        size={14} className="text-[#666680]"              />}
      </div>
      <div className={`font-mono text-3xl font-bold ${c.text}`}
        style={{ textShadow: `0 0 20px ${c.glow}` }}>
        {value}
      </div>
      {sub && <p className="text-[11px] text-[#666680]">{sub}</p>}
      {sparkData && <LiveSparkline data={sparkData} color={c.text.includes('cyan') ? '#00F0FF' : c.text.includes('green') ? '#00FF94' : c.text.includes('amber') ? '#FFB800' : '#FF3B3B'} height={28} />}
    </div>
  )
}

export default function KPICards({ kpis, latencyHistory, cpuHistory }) {
  const healthColor = kpis.health >= 90 ? 'green' : kpis.health >= 70 ? 'amber' : 'red'

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        title="MTTR"
        value={kpis.mttr || '—'}
        sub="Mean time to resolution"
        color="cyan"
        trend="down"
        sparkData={[]}
      />
      <KPICard
        title="Anomalies Today"
        value={kpis.anomaliesToday}
        sub={kpis.anomaliesToday > 0 ? `+${kpis.anomaliesToday} detected` : 'All clear'}
        color={kpis.anomaliesToday > 5 ? 'red' : kpis.anomaliesToday > 0 ? 'amber' : 'green'}
        trend={kpis.anomaliesToday > 0 ? 'up' : 'flat'}
      />
      <KPICard
        title="Self-Healed"
        value={kpis.selfHealed}
        sub={`${kpis.autoRate || 0}% auto-resolution rate`}
        color="green"
        trend="up"
      />
      <KPICard
        title="Health Score"
        value={`${kpis.health?.toFixed(0) ?? 100}`}
        sub="Overall system health"
        color={healthColor}
        sparkData={cpuHistory || []}
      />
    </div>
  )
}
