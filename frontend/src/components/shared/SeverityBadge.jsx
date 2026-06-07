import React from 'react'

export default function SeverityBadge({ severity }) {
  const s = (severity || '').toUpperCase()
  if (s === 'CRITICAL') return <span className="badge badge-red">CRITICAL</span>
  if (s === 'ERROR')    return <span className="badge badge-red">ERROR</span>
  if (s === 'HIGH')     return <span className="badge badge-red">HIGH</span>
  if (s === 'MEDIUM')   return <span className="badge badge-amber">MEDIUM</span>
  if (s === 'WARN' || s === 'WARNING') return <span className="badge badge-amber">WARN</span>
  if (s === 'LOW')      return <span className="badge badge-green">LOW</span>
  return <span className="badge badge-muted">{s || 'INFO'}</span>
}
