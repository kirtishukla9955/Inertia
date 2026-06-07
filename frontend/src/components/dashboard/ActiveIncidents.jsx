import React from 'react'
import { AlertTriangle } from 'lucide-react'
import SeverityBadge from '../shared/SeverityBadge'
import { cn } from '../../lib/utils'

export default function ActiveIncidents({ incidents, onSelect }) {
  const open = incidents.filter(i => i.status === 'open').slice(0, 6)

  return (
    <div className="panel flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.06)] shrink-0">
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} className="text-[var(--accent-amber)]" />
          <h3 className="text-sm font-semibold text-white">Active Incidents</h3>
        </div>
        {open.length > 0 && (
          <span className="badge badge-red">{open.length}</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {open.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-[#444460]">
            <div className="w-8 h-8 rounded-full bg-[rgba(0,255,148,0.08)] border border-[rgba(0,255,148,0.2)] flex items-center justify-center">
              <span className="text-[var(--accent-green)] text-lg">✓</span>
            </div>
            <span className="text-xs font-mono">All systems nominal</span>
          </div>
        ) : (
          open.map(inc => (
            <button
              key={inc.id}
              onClick={() => onSelect?.(inc)}
              className="w-full flex items-center gap-3 px-4 py-3 border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.03)] transition-colors text-left group"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-red)] shadow-[0_0_6px_var(--accent-red)] animate-glow-pulse shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono text-[10px] text-[var(--accent-cyan)]">{inc.id}</span>
                  <SeverityBadge severity={inc.severity || inc.level} />
                </div>
                <p className="text-xs text-[#999] truncate">{inc.incident_signature || inc.message?.slice(0, 60)}</p>
              </div>
              <span className="text-[10px] text-[#444460] font-mono shrink-0">
                {new Date(inc.timestamp).toLocaleTimeString()}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
