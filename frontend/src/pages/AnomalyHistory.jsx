import React, { useState, useEffect, useCallback } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import SeverityBadge from '../components/shared/SeverityBadge'
import ForensicDrawer from '../components/drawers/ForensicDrawer'
import { API } from '../lib/utils'

export default function AnomalyHistory() {
  const [incidents, setIncidents] = useState([])
  const [stats, setStats]         = useState({})
  const [loading, setLoading]     = useState(true)
  const [page, setPage]           = useState(1)
  const [total, setTotal]         = useState(0)
  const [expanded, setExpanded]   = useState(null)
  const [selected, setSelected]   = useState(null)
  const [filter, setFilter]       = useState({ severity: '', status: '' })
  const PAGE_SIZE = 20

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page, page_size: PAGE_SIZE })
    if (filter.severity) params.set('severity', filter.severity)
    if (filter.status)   params.set('status', filter.status)
    fetch(`${API}/api/incidents?${params}`)
      .then(r => r.json())
      .then(d => { setIncidents(d.items || []); setTotal(d.total || 0) })
      .finally(() => setLoading(false))
  }, [page, filter])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    fetch(`${API}/api/incidents/stats`)
      .then(r => r.json())
      .then(setStats)
      .catch(() => {})
  }, [])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="h-full flex flex-col p-5 gap-4 overflow-y-auto scrollbar-thin">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 shrink-0">
        {[
          { label: 'Total Incidents', value: stats.total ?? '—', color: 'text-white' },
          { label: 'Auto-Resolved Rate', value: `${stats.auto_resolved_rate ?? 0}%`, color: 'text-[var(--accent-green)]' },
          { label: 'Avg MTTR', value: stats.avg_ttr_seconds > 0 ? `${Math.floor(stats.avg_ttr_seconds/60)}m ${Math.round(stats.avg_ttr_seconds%60)}s` : '—', color: 'text-[var(--accent-cyan)]' },
        ].map(s => (
          <div key={s.label} className="panel p-4 text-center">
            <div className={`font-mono text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-[#666680] mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="panel p-3 flex items-center gap-3 shrink-0">
        <select
          value={filter.severity}
          onChange={e => { setFilter(f => ({ ...f, severity: e.target.value })); setPage(1) }}
          className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded px-2 py-1 text-xs text-white"
        >
          <option value="">All Severities</option>
          {['CRITICAL','HIGH','MEDIUM','LOW'].map(s => <option key={s}>{s}</option>)}
        </select>
        <select
          value={filter.status}
          onChange={e => { setFilter(f => ({ ...f, status: e.target.value })); setPage(1) }}
          className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded px-2 py-1 text-xs text-white"
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
        </select>
        <span className="text-xs text-[#666680] ml-auto font-mono">{total} incidents</span>
      </div>

      {/* Table */}
      <div className="panel flex-1 min-h-0 overflow-y-auto scrollbar-thin">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-[rgba(8,8,8,0.95)] border-b border-[rgba(255,255,255,0.07)]">
            <tr>
              {['ID','Timestamp','Severity','Service','Root Cause','Remediation','Status','TTR'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold text-[#666680] uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="text-center py-12 text-[#444460] font-mono text-sm">Loading incidents...</td></tr>
            ) : incidents.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-12 text-[#444460] font-mono text-sm">No incidents found</td></tr>
            ) : incidents.map(inc => (
              <React.Fragment key={inc.id}>
                <tr
                  className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)] cursor-pointer transition-colors"
                  onClick={() => setExpanded(expanded === inc.id ? null : inc.id)}
                >
                  <td className="px-4 py-3 font-mono text-[var(--accent-cyan)] whitespace-nowrap">{inc.id}</td>
                  <td className="px-4 py-3 text-[#666680] font-mono whitespace-nowrap">{new Date(inc.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-3"><SeverityBadge severity={inc.severity} /></td>
                  <td className="px-4 py-3 text-white font-mono">{inc.affected_service || inc.service}</td>
                  <td className="px-4 py-3 text-[#999] max-w-[200px]">
                    <span className="truncate block">{inc.incident_signature || inc.root_cause?.slice(0, 50)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge badge-amber">{inc.remediation_action || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${inc.status === 'resolved' ? 'badge-green' : 'badge-red'}`}>
                      {inc.status?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[#666680] whitespace-nowrap">
                    {inc.ttr_seconds != null ? `${Math.round(inc.ttr_seconds)}s` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {expanded === inc.id ? <ChevronUp size={14} className="text-[#666680]" /> : <ChevronDown size={14} className="text-[#666680]" />}
                  </td>
                </tr>
                {expanded === inc.id && (
                  <tr className="border-b border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.3)]">
                    <td colSpan={9} className="px-6 py-4">
                      <div className="flex flex-col gap-3">
                        <p className="text-sm text-[#ccc] leading-relaxed">{inc.root_cause_analysis || inc.root_cause}</p>
                        <div className="flex gap-3">
                          <button
                            className="btn btn-cyan text-xs"
                            onClick={() => setSelected(inc)}
                          >
                            Open Forensic Drawer →
                          </button>
                          {inc.status === 'open' && (
                            <button
                              className="btn text-xs"
                              onClick={() =>
                                fetch(`${API}/api/incidents/${inc.id}/resolve`, { method: 'PATCH' })
                                  .then(() => load())
                              }
                            >
                              Mark Resolved
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 shrink-0">
          <button className="btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
          <span className="font-mono text-xs text-[#666680]">Page {page} of {totalPages}</span>
          <button className="btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
        </div>
      )}

      {selected && <ForensicDrawer incident={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
