import React from 'react'
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'
import AnimatedNumber from '../shared/AnimatedNumber'

export default function IsolationForestGauge({ score }) {
  const norm  = Math.max(0, Math.min(100, ((score + 1) / 2) * 100))
  const color = norm > 60 ? '#00FF94' : norm > 30 ? '#FFB800' : '#FF3B3B'
  const label = norm > 60 ? 'NOMINAL' : norm > 30 ? 'ELEVATED RISK' : 'CRITICAL ANOMALY'

  const data = [{ value: norm, fill: color }]

  return (
    <div className="panel p-4 flex flex-col items-center">
      <div className="flex items-center justify-between w-full mb-2">
        <h3 className="text-sm font-semibold text-white tracking-wide">Isolation Forest</h3>
        <span className="font-mono text-[10px] text-[#666680]">Anomaly Score</span>
      </div>

      <div className="relative w-full" style={{ height: 140 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%" cy="80%"
            innerRadius="65%" outerRadius="90%"
            startAngle={180} endAngle={0}
            data={data}
          >
            <RadialBar
              dataKey="value" cornerRadius={4}
              background={{ fill: 'rgba(255,255,255,0.04)' }}
            />
          </RadialBarChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingTop: 40 }}>
          <span className="font-mono text-3xl font-bold" style={{ color, textShadow: `0 0 20px ${color}60` }}>
            {score.toFixed(3)}
          </span>
          <span className="text-[10px] font-bold tracking-widest mt-1" style={{ color }}>
            {label}
          </span>
        </div>
      </div>
    </div>
  )
}
