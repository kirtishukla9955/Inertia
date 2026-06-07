import React, { useEffect, useState } from 'react'

const LETTERS = ['I','N','E','R','T','I','A']
const IN_STAGGER  = 90
const IN_DUR      = 700
const HOLD        = 300
const IN_TOTAL    = IN_STAGGER * (LETTERS.length - 1) + IN_DUR + HOLD
const OUT_STAGGER = 55
const OUT_DUR     = 450
const CURTAIN_DELAY = IN_TOTAL + 100
const CURTAIN_DUR   = 1100
export const INTRO_DONE_MS = CURTAIN_DELAY + CURTAIN_DUR

export function IntroAnimation({ onDone }) {
  const [phase, setPhase]       = useState('idle')
  const [curtainUp, setCurtainUp] = useState(false)

  useEffect(() => {
    const t0 = setTimeout(() => setPhase('in'),  80)
    const t1 = setTimeout(() => setPhase('out'), IN_TOTAL)
    const t2 = setTimeout(() => setCurtainUp(true), CURTAIN_DELAY)
    const t3 = setTimeout(() => { onDone(); setPhase('done') }, INTRO_DONE_MS)
    return () => [t0,t1,t2,t3].forEach(clearTimeout)
  }, [onDone])

  if (phase === 'done') return null

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none" aria-hidden>
      {/* Curtain */}
      <div
        className="absolute inset-x-0 top-0 transition-none"
        style={{
          bottom: curtainUp ? '100%' : '0%',
          transition: curtainUp ? `bottom ${CURTAIN_DUR}ms cubic-bezier(0.76,0,0.24,1)` : 'none',
          background: '#000000',
        }}
      />
      {/* Letters */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex" style={{ gap: '0.05em' }}>
          {LETTERS.map((letter, i) => {
            const inDelay  = i * IN_STAGGER
            const outDelay = i * OUT_STAGGER
            const isIn     = phase === 'in'
            const isOut    = phase === 'out'
            const opacity  = phase === 'idle' ? 0 : isIn ? 1 : 0
            const blur     = phase === 'idle' ? 36 : isIn ? 0 : 24
            const ty       = phase === 'idle' ? 48 : isIn ? 0 : -20
            const transition = isOut
              ? `opacity ${OUT_DUR}ms ease ${outDelay}ms, filter ${OUT_DUR}ms ease ${outDelay}ms, transform ${OUT_DUR}ms ease ${outDelay}ms`
              : isIn
              ? `opacity ${IN_DUR}ms cubic-bezier(0.16,1,0.3,1) ${inDelay}ms, filter ${IN_DUR}ms cubic-bezier(0.16,1,0.3,1) ${inDelay}ms, transform ${IN_DUR}ms cubic-bezier(0.16,1,0.3,1) ${inDelay}ms`
              : 'none'
            return (
              <span
                key={i}
                className="font-bold text-white leading-none select-none"
                style={{
                  fontSize: `calc((100vw - 64px) / ${LETTERS.length})`,
                  letterSpacing: '0.04em',
                  opacity, filter: `blur(${blur}px)`,
                  transform: `translateY(${ty}px)`,
                  transition,
                  willChange: 'opacity, filter, transform',
                  fontFamily: 'Inter, sans-serif',
                  color: letter === 'I' && i === 0 ? 'var(--accent-cyan)' : '#ffffff',
                  textShadow: letter === 'I' && i === 0 ? '0 0 30px rgba(0,240,255,0.8)' : 'none',
                }}
              >
                {letter}
              </span>
            )
          })}
        </div>
      </div>
      {/* Cyan velocity line under the letters */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          style={{
            width: `calc((100vw - 64px) * ${LETTERS.length / LETTERS.length} + 16px)`,
            height: '2px',
            background: 'linear-gradient(to right, transparent, var(--accent-cyan), transparent)',
            boxShadow: '0 0 12px var(--accent-cyan)',
            opacity: phase === 'in' ? 0.7 : 0,
            transition: `opacity 0.5s ease ${IN_DUR}ms`,
            marginTop: `calc((100vw - 64px) / ${LETTERS.length} * 0.1)`,
          }}
        />
      </div>
    </div>
  )
}
