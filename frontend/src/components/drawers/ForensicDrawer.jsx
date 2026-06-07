import React, { useState } from 'react'
import { X, FileText, Database, Brain, Webhook, Zap } from 'lucide-react'
import SeverityBadge from '../shared/SeverityBadge'
import { cn } from '../../lib/utils'

const TABS = [
  { id: 'context',  label: 'Context',   icon: FileText },
  { id: 'rag',      label: 'RAG',        icon: Database },
  { id: 'llm',      label: 'Diagnosis',  icon: Brain },
  { id: 'webhook',  label: 'Webhook',    icon: Webhook },
  { id: 'healing',  label: 'Healing',    icon: Zap },
]

const HEALING_STEPS = [
  'Webhook Dispatched',
  'Signature Verified',
  'Action Whitelisted',
  'Command Executed',
  'Monitoring (60s)',
  'Resolved',
]

function CodeBlock({ children }) {
  return (
    <pre className="bg-[rgba(0,0,0,0.5)] border border-[rgba(255,255,255,0.07)] rounded-lg p-4 text-[11px] font-mono text-[#00F0FF] overflow-x-auto whitespace-pre-wrap break-all">
      {children}
    </pre>
  )
}

export default function ForensicDrawer({ incident, onClose }) {
  const [tab, setTab] = useState('context')
  if (!incident) return null

  const diag    = incident
  const ragHits = incident.rag_hits || []
  const webhookPayload = incident.webhook_payload || {}
  const isResolved = incident.status === 'resolved'

  const healingStep = isResolved ? 6
    : incident.webhook_status === 'dispatched' ? 4
    : incident.webhook_status === 'skipped' ? 3
    : 1

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      {/* Backdrop */}
      <div className="flex-1 bg-[rgba(0,0,0,0.6)]" />
      {/* Drawer */}
      <div
        className="w-[48vw] min-w-[400px] h-full flex flex-col border-l border-[rgba(255,255,255,0.08)]"
        style={{ background: 'rgba(8,8,8,0.98)', backdropFilter: 'blur(20px)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.07)] shrink-0">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm text-[var(--accent-cyan)]">{incident.id}</span>
              <SeverityBadge severity={incident.severity || incident.level} />
              <span className={`badge ${isResolved ? 'badge-green' : 'badge-red'}`}>
                {isResolved ? 'RESOLVED' : 'OPEN'}
              </span>
            </div>
            <p className="text-xs text-[#666680] font-mono">
              {incident.incident_signature || 'Forensic Analysis'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-[#666680] hover:text-white hover:bg-white/5 rounded-lg transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[rgba(255,255,255,0.07)] shrink-0 px-2 pt-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold transition-all border-b-2 -mb-px",
                tab === id
                  ? "border-[var(--accent-cyan)] text-[var(--accent-cyan)]"
                  : "border-transparent text-[#666680] hover:text-white"
              )}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-5">

          {tab === 'context' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'CPU', value: `${Number(incident.cpu || 0).toFixed(1)}%`, color: '#00F0FF' },
                  { label: 'RAM', value: `${Number(incident.ram || 0).toFixed(1)}%`, color: '#FFB800' },
                  { label: 'Latency', value: `${Number(incident.latency_ms || 0).toFixed(0)}ms`, color: '#00FF94' },
                ].map(m => (
                  <div key={m.label} className="panel p-3 text-center">
                    <div className="text-[10px] text-[#666680] mb-1">{m.label}</div>
                    <div className="font-mono text-lg font-bold" style={{ color: m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>
              <div>
                <div className="text-[10px] text-[#666680] mb-2 uppercase tracking-wider">Anomalous Log Entry</div>
                <div className={cn(
                  "p-3 rounded-lg border-l-4 border-[var(--accent-red)] bg-[rgba(255,59,59,0.05)] font-mono text-xs",
                )}>
                  <span className="text-[#666680]">{new Date(incident.timestamp).toLocaleString()}</span>
                  <span className="text-[var(--accent-red)] mx-2">[{incident.level}]</span>
                  <span className="text-[var(--accent-cyan)]">[{incident.service}]</span>
                  <span className="text-white ml-2">{incident.message}</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[#666680] mb-2 uppercase tracking-wider">Anomaly Score</div>
                <div className="panel p-3 font-mono text-sm">
                  <span className="text-[#666680]">score = </span>
                  <span className="text-[var(--accent-red)]">{Number(incident.anomaly_score || 0).toFixed(4)}</span>
                  <span className="text-[#666680] ml-3">→ ANOMALY (−1)</span>
                </div>
              </div>
            </div>
          )}

          {tab === 'rag' && (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-[#666680]">{ragHits.length} similar incidents found in knowledge base</p>
              {ragHits.length === 0 ? (
                <div className="panel p-6 text-center text-[#444460] text-sm">No RAG matches found</div>
              ) : ragHits.map((hit, i) => (
                <div key={i} className="panel p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">{hit.payload?.title}</span>
                    <span className="badge badge-cyan">{(hit.score * 100).toFixed(1)}% match</span>
                  </div>
                  <p className="text-xs text-[#999] leading-relaxed">{hit.payload?.content}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-[#666680]">Recommended action:</span>
                    <span className="badge badge-green">{hit.payload?.action}</span>
                  </div>
                  <div className="w-full bg-[rgba(255,255,255,0.05)] rounded-full h-1 mt-1">
                    <div
                      className="h-full rounded-full bg-[var(--accent-cyan)]"
                      style={{ width: `${hit.score * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'llm' && (
            <div className="flex flex-col gap-4">
              <div className="panel p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="badge badge-cyan">{diag.incident_signature || 'N/A'}</span>
                  <SeverityBadge severity={diag.severity} />
                </div>
                <div>
                  <div className="text-[10px] text-[#666680] mb-1.5 uppercase tracking-wider">Root Cause Analysis</div>
                  <p className="text-sm text-[#ccc] leading-relaxed">{diag.root_cause_analysis || diag.root_cause}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-[10px] text-[#666680] mb-1">Affected Service</div>
                    <span className="font-mono text-[var(--accent-cyan)]">{diag.affected_service || diag.service}</span>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#666680] mb-1">Est. Resolution</div>
                    <span className="font-mono text-[var(--accent-amber)]">{diag.estimated_resolution_seconds || diag.estimated_resolution_time_seconds || '?'}s</span>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#666680] mb-1">Action</div>
                    <span className="badge badge-amber">{diag.remediation_action}</span>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#666680] mb-1">Target</div>
                    <span className="font-mono text-white text-[11px]">{diag.remediation_target}</span>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[#666680] mb-2 uppercase tracking-wider">Raw JSON</div>
                <CodeBlock>{JSON.stringify({
                  incident_signature: diag.incident_signature,
                  root_cause_analysis: diag.root_cause_analysis,
                  severity: diag.severity,
                  affected_service: diag.affected_service,
                  remediation_action: diag.remediation_action,
                  remediation_target: diag.remediation_target,
                  estimated_resolution_time_seconds: diag.estimated_resolution_seconds,
                }, null, 2)}</CodeBlock>
              </div>
            </div>
          )}

          {tab === 'webhook' && (
            <div className="flex flex-col gap-4">
              <div>
                <div className="text-[10px] text-[#666680] mb-2 uppercase tracking-wider">Dispatch Status</div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${incident.webhook_status === 'dispatched' ? 'badge-green' : incident.webhook_status === 'rejected' || incident.webhook_status === 'failed' ? 'badge-red' : 'badge-amber'}`}>
                    {(incident.webhook_status || 'PENDING').toUpperCase()}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[#666680] mb-2 uppercase tracking-wider">Payload Sent</div>
                <CodeBlock>{JSON.stringify({
                  incident_id: incident.id,
                  action: incident.remediation_action,
                  target: incident.remediation_target,
                  severity: incident.severity,
                  'X-Inertia-Signature': 'sha256=****masked****',
                }, null, 2)}</CodeBlock>
              </div>
              <div>
                <div className="text-[10px] text-[#666680] mb-2 uppercase tracking-wider">Webhook Result</div>
                <CodeBlock>{JSON.stringify(webhookPayload, null, 2)}</CodeBlock>
              </div>
            </div>
          )}

          {tab === 'healing' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                {HEALING_STEPS.map((step, i) => {
                  const stepNum = i + 1
                  const isDone  = stepNum <= healingStep
                  const isActive = stepNum === healingStep + 1
                  return (
                    <div key={step} className="flex items-center gap-4">
                      <div className={cn(
                        "w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 font-mono text-xs font-bold transition-all",
                        isDone
                          ? "border-[var(--accent-green)] bg-[rgba(0,255,148,0.15)] text-[var(--accent-green)]"
                          : isActive
                          ? "border-[var(--accent-cyan)] bg-[rgba(0,240,255,0.1)] text-[var(--accent-cyan)]"
                          : "border-[rgba(255,255,255,0.1)] text-[#444460]"
                      )}>
                        {isDone ? '✓' : stepNum}
                      </div>
                      <div className="flex-1">
                        <span className={cn(
                          "text-sm font-medium",
                          isDone ? "text-[var(--accent-green)]" : isActive ? "text-[var(--accent-cyan)]" : "text-[#444460]"
                        )}>{step}</span>
                      </div>
                      {isDone && <span className="text-[10px] text-[#444460] font-mono">DONE</span>}
                      {isActive && <span className="text-[10px] text-[var(--accent-cyan)] font-mono animate-pulse">ACTIVE</span>}
                    </div>
                  )
                })}
              </div>

              {isResolved ? (
                <div className="panel p-4 border-[rgba(0,255,148,0.2)] bg-[rgba(0,255,148,0.05)] text-center">
                  <div className="text-[var(--accent-green)] font-bold text-sm">✓ Autonomously Resolved</div>
                  {incident.resolution_time && (
                    <div className="text-[10px] text-[#666680] mt-1 font-mono">
                      at {new Date(incident.resolution_time).toLocaleString()}
                      {incident.ttr_seconds && ` · TTR: ${Math.round(incident.ttr_seconds)}s`}
                    </div>
                  )}
                </div>
              ) : (
                <div className="panel p-4 border-[rgba(255,184,0,0.2)] bg-[rgba(255,184,0,0.05)] text-center">
                  <div className="text-[var(--accent-amber)] font-bold text-sm">⚡ Remediation In Progress</div>
                  <div className="text-[10px] text-[#666680] mt-1">{incident.remediation_action} → {incident.remediation_target}</div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
