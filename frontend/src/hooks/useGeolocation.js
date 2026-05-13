import { useCallback, useMemo, useRef, useState } from 'react'
import { MAP } from '../utils/constants'
import { calcularDistanciaMetros, calcularKilometrosRuta } from '../utils/distanceCalculator'

export function useGeolocation({ onMessage } = {}) {
  const watchGpsRef = useRef(null)
  const ubicacionActualRef = useRef(null)

  const [ubicacionActual, setUbicacionActual] = useState(null)
  const [rutaRecorrida, setRutaRecorrida] = useState([])
  const [centrarMapaToken, setCentrarMapaToken] = useState(0)

  const iniciarSeguimientoGps = useCallback(() => {
    if (!navigator.geolocation) {
      onMessage?.('Este navegador no soporta geolocalizacion.')
      return
    }
    if (watchGpsRef.current) return

    watchGpsRef.current = navigator.geolocation.watchPosition(
      (posicion) => {
        const punto = {
          latitud: posicion.coords.latitude,
          longitud: posicion.coords.longitude,
          precision: posicion.coords.accuracy,
          timestamp: posicion.timestamp,
        }
        ubicacionActualRef.current = punto
        setUbicacionActual(punto)
        setRutaRecorrida((ruta) => {
          const ultimo = ruta[ruta.length - 1]
          if (ultimo && calcularDistanciaMetros(ultimo, punto) < MAP.MIN_DISTANCIA_ENTRE_PUNTOS_METROS) {
            return ruta
          }
          return [...ruta, punto]
        })
      },
      () => onMessage?.('No se pudo obtener GPS. Revisa permisos de ubicacion.'),
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000,
      },
    )
  }, [onMessage])

  const detenerSeguimientoGps = useCallback(() => {
    if (watchGpsRef.current) {
      navigator.geolocation.clearWatch(watchGpsRef.current)
      watchGpsRef.current = null
    }
  }, [])

  const resetRuta = useCallback(() => {
    setRutaRecorrida([])
  }, [])

  const centrarMapa = useCallback(() => {
    setCentrarMapaToken((token) => token + 1)
  }, [])

  const distanciaKm = useMemo(() => calcularKilometrosRuta(rutaRecorrida), [rutaRecorrida])

  return {
    ubicacionActual,
    ubicacionActualRef,
    rutaRecorrida,
    distanciaKm,
    centrarMapaToken,
    iniciarSeguimientoGps,
    detenerSeguimientoGps,
    resetRuta,
    centrarMapa,
  }
}
