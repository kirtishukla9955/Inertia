import React, { useRef, useEffect } from 'react'

export default function LiveSparkline({ data = [], color = '#00F0FF', height = 32 }) {
  const canvasRef = useRef(null)
  const rafRef    = useRef(0)
  const ptsRef    = useRef([])

  useEffect(() => {
    if (data.length > 0) {
      ptsRef.current = data.slice(-30).map(v => v / 100)
    }
  }, [data])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let pts = ptsRef.current.length > 0
      ? [...ptsRef.current]
      : Array.from({ length: 24 }, (_, i) => 0.2 + 0.5 * Math.abs(Math.sin(i * 0.6)))

    const draw = () => {
      const W = canvas.offsetWidth
      const H = canvas.offsetHeight
      canvas.width  = W * devicePixelRatio
      canvas.height = H * devicePixelRatio
      ctx.scale(devicePixelRatio, devicePixelRatio)
      ctx.clearRect(0, 0, W, H)

      if (ptsRef.current.length > 0) {
        pts = ptsRef.current.slice(-30)
      }

      const N    = pts.length
      const step = W / Math.max(N - 1, 1)
      const grad = ctx.createLinearGradient(0, 0, 0, H)
      grad.addColorStop(0, color.replace(')', ',0.25)').replace('rgb', 'rgba').replace('#00F0FF', 'rgba(0,240,255,0.2)'))
      grad.addColorStop(1, 'rgba(0,0,0,0)')

      ctx.beginPath()
      ctx.moveTo(0, H)
      pts.forEach((v, i) => ctx.lineTo(i * step, H - v * H * 0.88))
      ctx.lineTo((N - 1) * step, H)
      ctx.closePath()
      ctx.fillStyle = grad
      ctx.fill()

      ctx.beginPath()
      pts.forEach((v, i) => {
        if (i === 0) ctx.moveTo(0, H - v * H * 0.88)
        else ctx.lineTo(i * step, H - v * H * 0.88)
      })
      ctx.strokeStyle = color
      ctx.lineWidth   = 1.5
      ctx.stroke()

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [color])

  return <canvas ref={canvasRef} style={{ width: '100%', height, display: 'block' }} />
}
