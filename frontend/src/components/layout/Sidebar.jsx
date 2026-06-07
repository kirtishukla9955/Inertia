import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Terminal, AlertTriangle, Database, Zap, Activity, Settings, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/utils'

const NAV = [
  { name: 'Dashboard',      path: '/',          icon: Home },
  { name: 'Log Stream',     path: '/logs',       icon: Terminal },
  { name: 'Anomaly History',path: '/history',    icon: AlertTriangle },
  { name: 'Knowledge Base', path: '/knowledge',  icon: Database },
  { name: 'Self-Healing',   path: '/actions',    icon: Zap },
  { name: 'System Health',  path: '/health',     icon: Activity },
  { name: 'Settings',       path: '/settings',   icon: Settings },
]

export default function Sidebar({ systemStatus = 'nominal' }) {
  const [collapsed, setCollapsed] = useState(false)
  const isRed = systemStatus === 'incident'

  return (
    <div
      className={cn(
        "flex flex-col h-full border-r border-[rgba(255,255,255,0.07)] transition-all duration-300 z-10 shrink-0",
        collapsed ? "w-16" : "w-56"
      )}
      style={{ background: 'rgba(6,6,6,0.95)', backdropFilter: 'blur(20px)' }}
    >
      {/* Logo row */}
      <div className="flex items-center justify-between h-16 border-b border-[rgba(255,255,255,0.07)] px-4">
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Logo mark */}
          <div className="relative w-7 h-7 flex items-center justify-center shrink-0">
            <span className="font-black text-xl text-white leading-none" style={{ fontFamily: 'Inter' }}>I</span>
            <div
              className="absolute"
              style={{
                top: '50%', left: '-3px', right: '-3px',
                height: '2px',
                background: 'linear-gradient(to right, transparent, var(--accent-cyan), transparent)',
                boxShadow: '0 0 8px var(--accent-cyan)',
                transform: 'translateY(-50%) rotate(-10deg)',
              }}
            />
          </div>
          {!collapsed && (
            <span className="font-bold tracking-[0.15em] text-white text-sm whitespace-nowrap">
              INERTIA
            </span>
          )}
        </div>
        <button
          onClick={() => setCollapsed(c => !c)}
          className="text-[#666680] hover:text-white transition-colors p-1 rounded"
        >
          <ChevronRight size={14} className={cn("transition-transform duration-300", !collapsed && "rotate-180")} />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1 p-2 flex-1 mt-2">
        {NAV.map(({ name, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) => cn(
              "flex items-center gap-3 rounded-lg transition-all duration-200 border-l-2 group overflow-hidden",
              collapsed ? "px-3 py-3 justify-center" : "px-3 py-2.5",
              isActive
                ? "bg-[rgba(0,240,255,0.08)] border-[var(--accent-cyan)] text-[var(--accent-cyan)]"
                : "border-transparent text-[#666680] hover:bg-[rgba(255,255,255,0.04)] hover:text-white"
            )}
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={18}
                  className={cn(
                    "shrink-0 transition-all duration-200",
                    isActive
                      ? "drop-shadow-[0_0_8px_rgba(0,240,255,0.7)]"
                      : "group-hover:text-[var(--accent-cyan)] group-hover:drop-shadow-[0_0_6px_rgba(0,240,255,0.5)]"
                  )}
                />
                {!collapsed && (
                  <span className={cn(
                    "text-sm font-medium whitespace-nowrap transition-colors",
                    isActive ? "text-[var(--accent-cyan)]" : ""
                  )}>
                    {name}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-[rgba(255,255,255,0.07)] flex flex-col gap-2">
        {!collapsed && (
          <div className="flex items-center justify-between px-1">
            <span className="font-mono text-[10px] text-[#444460]">v2.1.0</span>
            <span className="font-mono text-[10px] text-[#444460]">INERTIA</span>
          </div>
        )}
        <div className={cn("flex items-center gap-2", collapsed && "justify-center")}>
          <div className={cn(
            "w-2 h-2 rounded-full shrink-0",
            isRed
              ? "bg-[var(--accent-red)] shadow-[0_0_8px_var(--accent-red)]"
              : "bg-[var(--accent-green)] shadow-[0_0_8px_var(--accent-green)] animate-glow-pulse"
          )} />
          {!collapsed && (
            <span className="text-[11px] text-[#666680] font-mono">
              {isRed ? 'INCIDENT ACTIVE' : 'NOMINAL'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
