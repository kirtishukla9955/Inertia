import React, { useState, useEffect } from 'react'
import { Search, Database } from 'lucide-react'
import { API } from '../lib/utils'

export default function RAGKnowledgeBase() {
  const [runbooks, setRunbooks] = useState([])
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/rag/runbooks`)
      .then(r => r.json())
      .then(d => setRunbooks(d.runbooks || []))
      .catch(() => {})
  }, [])

  const handleSearch = async () => {
    if (!query.trim()) return
    setSearching(true)
    try {
      const r = await fetch(`${API}/api/rag/search?q=${encodeURIComponent(query)}&limit=5`)
      const d = await r.json()
      setResults(d.results || [])
    } catch {}
    setSearching(false)
  }

  return (
    <div className="h-full flex gap-4 p-5 overflow-hidden">
      {/* Left — runbooks */}
      <div className="w-80 shrink-0 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Database size={16} className="text-[var(--accent-cyan)]" />
          <h2 className="text-sm font-bold text-white tracking-wide">Knowledge Base</h2>
          <span className="badge badge-cyan ml-auto">{runbooks.length} docs</span>
        </div>
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto scrollbar-thin">
          {runbooks.map((rb, i) => (
            <div key={i} className="panel p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">{rb.title}</span>
              </div>
              <p className="text-[11px] text-[#666680] leading-relaxed line-clamp-3">{rb.content}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {(rb.tags || []).map(tag => (
                  <span key={tag} className="badge badge-muted text-[9px]">{tag}</span>
                ))}
              </div>
              <span className="badge badge-green self-start">{rb.action}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right — semantic search */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white tracking-wide">Semantic Search</h2>
          <span className="badge badge-cyan">Qdrant Active</span>
        </div>

        <div className="panel panel-scan p-3 flex items-center gap-3 shrink-0">
          <Search size={16} className="text-[#666680] shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search runbooks and incident history..."
            className="flex-1 bg-transparent text-sm text-white placeholder-[#444460] outline-none"
          />
          <button onClick={handleSearch} disabled={searching} className="btn btn-cyan shrink-0">
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin flex flex-col gap-3">
          {results.length === 0 && !searching && (
            <div className="flex items-center justify-center h-full text-[#333350] font-mono text-sm">
              Enter a query to search the knowledge base
            </div>
          )}
          {results.map((r, i) => (
            <div key={i} className="panel p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">{r.payload?.title}</span>
                <span className="badge badge-cyan">{(r.score * 100).toFixed(1)}% match</span>
              </div>
              <p className="text-xs text-[#999] leading-relaxed">{r.payload?.content}</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-[rgba(255,255,255,0.05)] rounded-full h-1.5">
                  <div
                    className="h-full rounded-full bg-[var(--accent-cyan)] transition-all"
                    style={{ width: `${r.score * 100}%` }}
                  />
                </div>
                <span className="badge badge-green shrink-0">{r.payload?.action}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
