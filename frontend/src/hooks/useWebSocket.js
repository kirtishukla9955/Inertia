import { useEffect, useRef, useCallback, useState } from 'react'
import { WS } from '../lib/utils'

export function useWebSocket(path, onMessage) {
  const wsRef       = useRef(null)
  const retryRef    = useRef(null)
  const retryCount  = useRef(0)
  const onMsgRef    = useRef(onMessage)
  onMsgRef.current  = onMessage
  const [connected, setConnected] = useState(false)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return
    const ws = new WebSocket(`${WS}${path}`)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      retryCount.current = 0
      clearTimeout(retryRef.current)
    }
    ws.onmessage = (e) => {
      try { onMsgRef.current(JSON.parse(e.data)) } catch {}
    }
    ws.onclose = () => {
      setConnected(false)
      const delay = Math.min(1000 * 2 ** retryCount.current, 30000)
      retryCount.current++
      retryRef.current = setTimeout(connect, delay)
    }
    ws.onerror = () => ws.close()
  }, [path])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(retryRef.current)
      wsRef.current?.close()
    }
  }, [connect])

  return { connected }
}
