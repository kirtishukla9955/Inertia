import React, { useState, useEffect } from 'react'
import { Save } from 'lucide-react'
import { API } from '../lib/utils'

function Section({ title, children }) {
  return (
    <div className="panel p-5 flex flex-col gap-4">
      <h3 className="text-xs font-bold text-[var(--accent-cyan)] uppercase tracking-[0.15em] border-b border-[rgba(255,255,255,0.07)] pb-2">{title}</h3>
      {children}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] text-[#666680] uppercase tracking-wider">{label}</label>
      {children}
    </div>
  )
}

const inputCls = "bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[var(--accent-cyan)] transition-colors"

export default function Settings() {
  const [cfg, setCfg]     = useState({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/settings`).then(r => r.json()).then(setCfg).catch(() => {})
  }, [])

  const save = async () => {
    await fetch(`${API}/api/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cfg)
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const set = (k, v) => setCfg(c => ({ ...c, [k]: v }))

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-5">
      <div className="max-w-2xl flex flex-col gap-4">
        <Section title="LLM Configuration">
          <Field label="Model">
            <select value={cfg.OLLAMA_MODEL || ''} onChange={e => set('OLLAMA_MODEL', e.target.value)} className={inputCls}>
              <option value="llama3.2">llama3.2</option>
              <option value="llama3.3">llama3.3</option>
              <option value="gemma3">gemma3</option>
              <option value="mistral">mistral</option>
            </select>
          </Field>
          <Field label="Ollama Endpoint">
            <input type="text" value={cfg.OLLAMA_URL || ''} onChange={e => set('OLLAMA_URL', e.target.value)} className={inputCls} />
          </Field>
        </Section>

        <Section title="Isolation Forest">
          <Field label={`Contamination Rate: ${cfg.IF_CONTAMINATION || 0.05}`}>
            <input type="range" min="0.01" max="0.20" step="0.01"
              value={cfg.IF_CONTAMINATION || 0.05}
              onChange={e => set('IF_CONTAMINATION', parseFloat(e.target.value))}
              className="w-full accent-[var(--accent-cyan)]"
            />
          </Field>
          <Field label="n_estimators">
            <input type="number" value={cfg.IF_N_ESTIMATORS || 100} onChange={e => set('IF_N_ESTIMATORS', parseInt(e.target.value))} className={inputCls} />
          </Field>
        </Section>

        <Section title="Qdrant Configuration">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Host">
              <input type="text" value={cfg.QDRANT_HOST || ''} onChange={e => set('QDRANT_HOST', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Port">
              <input type="number" value={cfg.QDRANT_PORT || 6333} onChange={e => set('QDRANT_PORT', parseInt(e.target.value))} className={inputCls} />
            </Field>
          </div>
        </Section>

        <Section title="Redis Streams">
          <Field label="Redis URL">
            <input type="text" value={cfg.REDIS_URL || ''} onChange={e => set('REDIS_URL', e.target.value)} className={inputCls} />
          </Field>
        </Section>

        <Section title="Webhook Security">
          <Field label="HMAC Secret">
            <input type="password" placeholder="••••••••••••" className={inputCls} />
          </Field>
        </Section>

        <button
          onClick={save}
          className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
          style={{
            background: saved ? 'rgba(0,255,148,0.2)' : 'rgba(0,240,255,0.15)',
            border: `1px solid ${saved ? 'rgba(0,255,148,0.4)' : 'rgba(0,240,255,0.4)'}`,
            color: saved ? 'var(--accent-green)' : 'var(--accent-cyan)',
            boxShadow: saved ? '0 0 20px rgba(0,255,148,0.2)' : '0 0 20px rgba(0,240,255,0.1)',
          }}
        >
          <Save size={14} />
          {saved ? 'Settings Saved ✓' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
