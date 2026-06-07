import React, { useState, useEffect } from 'react'
import { Zap, Plus, CheckCircle2, XCircle } from 'lucide-react'
import { API } from '../lib/utils'

export default function SelfHealingActions() {
  const [actions, setActions]     = useState([])
  const [whitelist, setWhitelist] = useState([])
  const [incidents, setIncidents] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]           = useState({ name: '', command_type: 'restart_service', target: '', risk_level: 'LOW', requires_approval: false })

  useEffect(() => {
    fetch(`${API}/api/actions`).then(r => r.json()).then(d => {
      setActions(d.actions || [])
      setWhitelist(d.whitelist || [])
    }).catch(() => {})
    fetch(`${API}/api/incidents?page_size=50`).then(r => r.json()).then(d => setIncidents(d.items || [])).catch(() => {})
  }, [])

  const handleCreate = async () => {
    const r = await fetch(`${API}/api/actions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const d = await r.json()
    setActions(a => [d, ...a])
    setShowModal(false)
    setForm({ name: '', command_type: 'restart_service', target: '', risk_level: 'LOW', requires_approval: false })
  }

  const executionLog = incidents.filter(i => i.webhook_status === 'dispatched' || i.remediation_action)

  return (
    <div className="h-full flex flex-col p-5 gap-5 overflow-y-auto scrollbar-thin">
      {/* Whitelist registry */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-[var(--accent-cyan)]" />
            <h2 className="text-sm font-bold text-white tracking-wide">Whitelist Action Registry</h2>
          </div>
          <button onClick={() => setShowModal(true)} className="btn btn-cyan">
            <Plus size={12} /> Add Action
          </button>
        </div>

        <div className="panel overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="border-b border-[rgba(255,255,255,0.07)]">
              <tr>
                {['Action ID','Name','Command Type','Target','Risk','Executed','Enabled'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold text-[#666680] uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {actions.map(a => (
                <tr key={a.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)]">
                  <td className="px-4 py-3 font-mono text-[var(--accent-cyan)]">{a.id}</td>
                  <td className="px-4 py-3 text-white">{a.name}</td>
                  <td className="px-4 py-3"><span className="badge badge-muted font-mono">{a.command_type}</span></td>
                  <td className="px-4 py-3 font-mono text-[#999]">{a.target}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${a.risk_level === 'LOW' ? 'badge-green' : 'badge-amber'}`}>{a.risk_level}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[#666680]">{a.times_executed || 0}</td>
                  <td className="px-4 py-3">
                    <div className={`w-8 h-4 rounded-full flex items-center px-0.5 cursor-pointer transition-colors ${a.enabled ? 'bg-[rgba(0,255,148,0.3)] justify-end' : 'bg-[rgba(255,255,255,0.1)] justify-start'}`}>
                      <div className={`w-3 h-3 rounded-full ${a.enabled ? 'bg-[var(--accent-green)]' : 'bg-[#555]'}`} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Execution Log */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-bold text-white tracking-wide">Execution Log</h2>
        <div className="panel flex flex-col divide-y divide-[rgba(255,255,255,0.04)]">
          {executionLog.length === 0 ? (
            <div className="text-center py-8 text-[#444460] font-mono text-xs">No executions yet</div>
          ) : executionLog.slice(0, 20).map(inc => {
            const ok = inc.status === 'resolved' || inc.webhook_status === 'dispatched'
            return (
              <div key={inc.id} className="flex items-center gap-4 px-4 py-3">
                {ok
                  ? <CheckCircle2 size={14} className="text-[var(--accent-green)] shrink-0" />
                  : <XCircle     size={14} className="text-[var(--accent-red)] shrink-0" />
                }
                <span className="font-mono text-[10px] text-[#444460] w-32 shrink-0">{new Date(inc.timestamp).toLocaleString()}</span>
                <span className="font-mono text-[10px] text-[var(--accent-cyan)] w-24 shrink-0">{inc.id}</span>
                <span className="badge badge-amber shrink-0">{inc.remediation_action}</span>
                <span className="text-[11px] text-[#999] flex-1 truncate">→ {inc.remediation_target}</span>
                <span className={`badge shrink-0 ${ok ? 'badge-green' : 'badge-red'}`}>
                  {ok ? 'SUCCESS' : 'FAILED'}
                </span>
                {inc.ttr_seconds != null && (
                  <span className="font-mono text-[10px] text-[#444460] shrink-0">{Math.round(inc.ttr_seconds)}s</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.7)]" onClick={() => setShowModal(false)}>
          <div className="panel p-6 w-[440px] flex flex-col gap-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-white">Add New Action</h3>
            {[
              { label: 'Action Name', key: 'name', type: 'text' },
              { label: 'Target Service', key: 'target', type: 'text' },
            ].map(f => (
              <div key={f.key} className="flex flex-col gap-1.5">
                <label className="text-[10px] text-[#666680] uppercase tracking-wider">{f.label}</label>
                <input
                  type="text"
                  value={form[f.key]}
                  onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))}
                  className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded px-3 py-2 text-xs text-white outline-none focus:border-[var(--accent-cyan)]"
                />
              </div>
            ))}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-[#666680] uppercase tracking-wider">Command Type</label>
              <select
                value={form.command_type}
                onChange={e => setForm(x => ({ ...x, command_type: e.target.value }))}
                className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded px-3 py-2 text-xs text-white"
              >
                {['restart_service','kill_process','clear_cache','scale_container','flush_connections'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-[#666680] uppercase tracking-wider">Risk Level</label>
              <select
                value={form.risk_level}
                onChange={e => setForm(x => ({ ...x, risk_level: e.target.value }))}
                className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded px-3 py-2 text-xs text-white"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
              </select>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <button onClick={handleCreate} className="btn btn-cyan flex-1">Save Action</button>
              <button onClick={() => setShowModal(false)} className="btn flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
