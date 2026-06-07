import React, { useState, useEffect, useRef } from 'react'
import { Bell, Settings, User } from 'lucide-react'
import { cn } from '../../lib/utils'

export default function Topbar({ incidentCount = 0, systemStatus = 'nominal' }) {
  const [time, setTime] = useState(new Date())
  const startTime = useRef(Date.now())
  const [uptime, setUptime] = useState({ d: 0, h: 0, m: 0, s: 0 })

  useEffect(() => {
    const t = setInterval(() => {
      const now = new Date()
      setTime(now)
      const elapsed = Math.floor((now - startTime.current) / 1000)
      setUptime({
        d: Math.floor(elapsed / 86400),
        h: Math.floor((elapsed % 86400) / 3600),
        m: Math.floor((elapsed % 3600) / 60),
        s: elapsed % 60,
      })
    }, 1000)
    return () => clearInterval(t)
  }, [])

  const isIncident = systemStatus === 'incident'

  return (
    <div
      className={cn(
        "h-16 flex items-center justify-between px-6 shrink-0 z-10 transition-all duration-300 border-b",
        isIncident ? "border-[rgba(255,59,59,0.4)]" : "border-[rgba(255,255,255,0.07)]"
      )}
      style={{ background: 'rgba(4,4,4,0.95)', backdropFilter: 'blur(20px)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="relative w-6 h-6 flex items-center justify-center shrink-0">
          <span className="font-black text-lg text-white leading-none">I</span>
          <div className="absolute" style={{
            top: '50%', left: '-3px', right: '-3px', height: '1.5px',
            background: 'linear-gradient(to right, transparent, var(--accent-cyan), transparent)',
            boxShadow: '0 0 6px var(--accent-cyan)',
            transform: 'translateY(-50%) rotate(-10deg)',
          }} />
        </div>
        <span className="font-bold tracking-[0.2em] text-white text-sm">INERTIA</span>
        {isIncident && <span className="badge badge-red animate-pulse ml-2">INCIDENT</span>}
      </div>

      {/* Clock */}
      <div className="hidden md:flex items-center gap-3 bg-[rgba(0,0,0,0.4)] px-4 py-2 rounded-lg border border-[rgba(255,255,255,0.06)]">
        <span className="font-mono text-sm text-[var(--accent-cyan)] tabular-nums" style={{ textShadow: '0 0 10px rgba(0,240,255,0.7)' }}>
          {time.toLocaleTimeString()}
        </span>
        <span className="text-[#333350]">|</span>
        <span className="font-mono text-xs text-[#666680] tabular-nums">
          UP {uptime.d}d {uptime.h}h {uptime.m}m
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button className="relative p-2.5 text-[#666680] hover:text-white hover:bg-white/5 rounded-lg transition-all">
          <Bell size={18} />
          {incidentCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-[var(--accent-red)] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {Math.min(incidentCount, 9)}
            </span>
          )}
        </button>
        <button className="p-2.5 text-[#666680] hover:text-white hover:bg-white/5 rounded-lg transition-all">
          <Settings size={18} />
        </button>
        <div className="w-7 h-7 rounded-full bg-[rgba(0,240,255,0.15)] border border-[rgba(0,240,255,0.3)] flex items-center justify-center ml-1">
          <User size={14} className="text-[var(--accent-cyan)]" />
        </div>
      </div>
    </div>
  )
}
