import React from 'react'
import AnimatedNumber from '../shared/AnimatedNumber'

export default function IsolationForestGauge({ score = 0.8 }) {
  const norm  = Math.max(0, Math.min(100, ((score + 1) / 2) * 100))
  const color = norm > 60 ? '#00FF94' : norm > 30 ? '#FFB800' : '#FF3B3B'
  const label = norm > 60 ? 'NOMINAL' : norm > 30 ? 'ELEVATED RISK' : 'CRITICAL ANOMALY'

  // SVG arc parameters
  const cx = 110, cy = 110, r = 80
  const startAngle = 210
  const endAngle   = 210 + (norm / 100) * 300
  const toRad = (deg) => (deg * Math.PI) / 180

  const arcPath = (start, end) => {
    const s = { x: cx + r * Math.cos(toRad(start)), y: cy + r * Math.sin(toRad(start)) }
    const e = { x: cx + r * Math.cos(toRad(end)),   y: cy + r * Math.sin(toRad(end)) }
    const large = end - start > 180 ? 1 : 0
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`
  }

  const trackPath  = arcPath(210, 210 + 300)
  const activePath = norm > 0 ? arcPath(210, endAngle) : null

  return (
    <div className="panel p-4 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-white tracking-wide">Isolation Forest</h3>
        <span className="font-mono text-[10px] text-[#666680]">Anomaly Score</span>
      </div>

      <div className="flex items-center justify-center relative" style={{ height: 160 }}>
        {/* SVG Arc Gauge */}
        <svg width="220" height="160" viewBox="0 0 220 160" className="absolute inset-0">
          {/* Track */}
          <path
            d={trackPath}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* Active arc */}
          {activePath && (
            <path
              d={activePath}
              fill="none"
              stroke={color}
              strokeWidth="10"
              strokeLinecap="round"
              style={{
                filter: `drop-shadow(0 0 6px ${color})`,
                transition: 'stroke 0.5s ease',
              }}
            />
          )}
        </svg>

        {/* Score text — centered, no overlap */}
        <div className="flex flex-col items-center justify-center z-10" style={{ marginTop: 12 }}>
          <span
            className="font-mono font-bold leading-none"
            style={{
              fontSize: 38,
              color,
              textShadow: `0 0 24px ${color}80`,
              transition: 'color 0.5s ease',
            }}
          >
            {score.toFixed(3)}
          </span>
          <span
            className="font-bold tracking-widest mt-2"
            style={{
              fontSize: 10,
              color,
              letterSpacing: '0.15em',
              transition: 'color 0.5s ease',
            }}
          >
            {label}
          </span>
        </div>
      </div>

      {/* Mini score bar at bottom */}
      <div className="mt-2 flex flex-col gap-1">
        <div className="w-full h-1 rounded-full bg-[rgba(255,255,255,0.06)]">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${norm}%`, background: color, boxShadow: `0 0 6px ${color}` }}
          />
        </div>
        <div className="flex justify-between text-[9px] font-mono text-[#444460]">
          <span>-1.0 ANOMALY</span>
          <span>+1.0 NOMINAL</span>
        </div>
      </div>
    </div>
  )
}
