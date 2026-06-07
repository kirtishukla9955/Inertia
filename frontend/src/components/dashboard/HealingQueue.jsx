import React from 'react'
import { Zap, CheckCircle2, XCircle, Loader } from 'lucide-react'

export default function HealingQueue({ incidents }) {
  const recent = incidents.slice(0, 5)

  return (
    <div className="panel flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[rgba(255,255,255,0.06)] shrink-0">
        <Zap size={14} className="text-[var(--accent-cyan)]" />
        <h3 className="text-sm font-semibold text-white">Self-Healing Queue</h3>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 flex flex-col gap-2">
        {recent.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[#444460] text-xs font-mono">
            Awaiting events...
          </div>
        ) : (
          recent.map(inc => {
            const ws = inc.webhook_status || 'pending'
            const isDone = ws === 'dispatched' || inc.status === 'resolved'
            const isFail = ws === 'rejected' || ws === 'failed'
            return (
              <div
                key={inc.id}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)]"
              >
                <div className="shrink-0">
                  {isDone  && <CheckCircle2 size={14} className="text-[var(--accent-green)]" />}
                  {isFail  && <XCircle      size={14} className="text-[var(--accent-red)]"   />}
                  {!isDone && !isFail && <Loader size={14} className="text-[var(--accent-cyan)] animate-spin" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-white truncate font-mono">
                    {inc.remediation_action || 'manual_intervention'}
                  </p>
                  <p className="text-[10px] text-[#666680] truncate">
                    {inc.affected_service || inc.service}
                  </p>
                </div>
                <span className={`text-[10px] font-mono shrink-0 ${isDone ? 'text-[var(--accent-green)]' : isFail ? 'text-[var(--accent-red)]' : 'text-[#666680]'}`}>
                  {isDone ? 'DONE' : isFail ? 'FAIL' : 'PENDING'}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
