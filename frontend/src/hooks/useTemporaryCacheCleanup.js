import { useCallback, useEffect, useRef, useState } from 'react'
import { TEMPORARY_CACHE } from '../utils/constants'
import { limpiarCacheTemporal } from '../utils/temporaryCache'

export function useTemporaryCacheCleanup({
  activo,
  canvasRef,
  intervaloMs = TEMPORARY_CACHE.INTERVALO_LIMPIEZA_MS,
  onCleanup,
} = {}) {
  const onCleanupRef = useRef(onCleanup)
  const [ultimaLimpieza, setUltimaLimpieza] = useState(null)
  const [ultimaLimpiezaTexto, setUltimaLimpiezaTexto] = useState('')
  const [limpiezasRealizadas, setLimpiezasRealizadas] = useState(0)

  useEffect(() => {
    onCleanupRef.current = onCleanup
  }, [onCleanup])

  const limpiarAhora = useCallback(() => {
    const resultado = limpiarCacheTemporal({ canvasRef })
    setUltimaLimpieza(resultado)
    setUltimaLimpiezaTexto(
      new Date(resultado.fechaISO).toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    )
    setLimpiezasRealizadas((total) => total + 1)
    onCleanupRef.current?.(resultado)
    console.info('Limpieza temporal ejecutada', resultado)
    return resultado
  }, [canvasRef])

  useEffect(() => {
    if (!activo) return undefined
    const intervalo = window.setInterval(limpiarAhora, intervaloMs)
    return () => window.clearInterval(intervalo)
  }, [activo, intervaloMs, limpiarAhora])

  useEffect(() => {
    if (!activo) return undefined

    const limpiarAlOcultar = () => {
      if (document.visibilityState === 'hidden') limpiarAhora()
    }

    document.addEventListener('visibilitychange', limpiarAlOcultar)
    window.addEventListener('pagehide', limpiarAhora)
    return () => {
      document.removeEventListener('visibilitychange', limpiarAlOcultar)
      window.removeEventListener('pagehide', limpiarAhora)
    }
  }, [activo, limpiarAhora])

  return {
    limpiarAhora,
    ultimaLimpieza,
    ultimaLimpiezaTexto,
    limpiezasRealizadas,
  }
}