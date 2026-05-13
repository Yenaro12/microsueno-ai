import { useCallback, useEffect, useRef, useState } from 'react'
import { EVENT_TYPES, RISK_LEVELS } from '../utils/constants'

export function useConnectionStatus({ registrarEvento, onMessage } = {}) {
  const [conectado, setConectado] = useState(() => navigator.onLine)
  const iniciadoRef = useRef(false)

  const registrarCambio = useCallback(
    (nuevoEstado) => {
      setConectado(nuevoEstado)
      if (!iniciadoRef.current) {
        iniciadoRef.current = true
        return
      }

      registrarEvento?.({
        tipoEvento: nuevoEstado ? EVENT_TYPES.CONEXION_RECUPERADA : EVENT_TYPES.CONEXION_PERDIDA,
        nivel: nuevoEstado ? RISK_LEVELS.BAJO : RISK_LEVELS.MEDIO,
        desplazamiento: 0,
        duracionMs: 0,
        accion: nuevoEstado ? 'Conexion del navegador recuperada' : 'Conexion del navegador perdida',
      })
      onMessage?.(nuevoEstado ? 'Conexion recuperada.' : 'Sin conexion. Se mantiene registro local.')
    },
    [onMessage, registrarEvento],
  )

  useEffect(() => {
    iniciadoRef.current = true
    const manejarOnline = () => registrarCambio(true)
    const manejarOffline = () => registrarCambio(false)

    window.addEventListener('online', manejarOnline)
    window.addEventListener('offline', manejarOffline)
    return () => {
      window.removeEventListener('online', manejarOnline)
      window.removeEventListener('offline', manejarOffline)
    }
  }, [registrarCambio])

  return { conectado }
}