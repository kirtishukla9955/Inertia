import React, { useEffect, useRef, useState } from 'react'

export default function AnimatedNumber({ value, decimals = 0, suffix = '', className = '' }) {
  const [display, setDisplay] = useState(value)
  const prev = useRef(value)

  useEffect(() => {
    const from = prev.current
    const to   = value
    if (from === to) return
    prev.current = to
    const dur  = 400
    const step = 16
    const steps = dur / step
    let i = 0
    const interval = setInterval(() => {
      i++
      const t = i / steps
      const ease = 1 - Math.pow(1 - t, 3)
      setDisplay(from + (to - from) * ease)
      if (i >= steps) { clearInterval(interval); setDisplay(to) }
    }, step)
    return () => clearInterval(interval)
  }, [value])

  return (
    <span className={className}>
      {Number(display).toFixed(decimals)}{suffix}
    </span>
  )
}
