import { useCallback, useMemo, useState } from 'react'
import { calcularRutaOsrm, crearRutaDirecta, resolverPuntoRuta } from '../services/routeService'

const formatearUbicacion = (ubicacion) =>
  ubicacion ? `${ubicacion.latitud.toFixed(6)}, ${ubicacion.longitud.toFixed(6)}` : ''

export function useRoutePlanner({ ubicacionActual, onMessage } = {}) {
  const [origenTexto, setOrigenTexto] = useState('')
  const [destinoTexto, setDestinoTexto] = useState('')
  const [origenRuta, setOrigenRuta] = useState(null)
  const [destinoRuta, setDestinoRuta] = useState(null)
  const [rutaPlanificada, setRutaPlanificada] = useState([])
  const [resumenRuta, setResumenRuta] = useState(null)
  const [estadoRuta, setEstadoRuta] = useState('sin-ruta')
  const [mensajeRuta, setMensajeRuta] = useState('Define origen y destino para calcular una ruta.')
  const [centrarRutaToken, setCentrarRutaToken] = useState(0)

  const origenSugerido = useMemo(() => formatearUbicacion(ubicacionActual), [ubicacionActual])

  const usarUbicacionActualComoOrigen = useCallback(() => {
    if (!ubicacionActual) {
      setMensajeRuta('Aun no hay ubicacion GPS para usar como origen.')
      onMessage?.('Aun no hay ubicacion GPS para usar como origen.')
      return
    }
    setOrigenTexto(formatearUbicacion(ubicacionActual))
    setMensajeRuta('Ubicacion actual asignada como punto de inicio.')
  }, [onMessage, ubicacionActual])

  const limpiarRuta = useCallback(() => {
    setOrigenRuta(null)
    setDestinoRuta(null)
    setRutaPlanificada([])
    setResumenRuta(null)
    setEstadoRuta('sin-ruta')
    setMensajeRuta('Ruta limpia. Define un nuevo origen y destino.')
  }, [])

  const calcularRuta = useCallback(async () => {
    setEstadoRuta('calculando')
    setMensajeRuta('Calculando ruta...')

    try {
      const origen = origenTexto.trim()
        ? await resolverPuntoRuta(origenTexto)
        : ubicacionActual
          ? {
              latitud: ubicacionActual.latitud,
              longitud: ubicacionActual.longitud,
              etiqueta: 'Ubicacion actual',
            }
          : null

      if (!origen) throw new Error('Ingresa un origen o activa GPS para usar tu ubicacion actual.')
      const destino = await resolverPuntoRuta(destinoTexto)

      let rutaCalculada
      try {
        rutaCalculada = await calcularRutaOsrm(origen, destino)
      } catch (error) {
        console.warn('OSRM no disponible; usando linea directa como respaldo', error)
        rutaCalculada = crearRutaDirecta(origen, destino)
      }

      setOrigenRuta(origen)
      setDestinoRuta(destino)
      setRutaPlanificada(rutaCalculada.puntos)
      setResumenRuta(rutaCalculada)
      setEstadoRuta(rutaCalculada.fallback ? 'fallback' : 'lista')
      setCentrarRutaToken((token) => token + 1)

      const mensaje = rutaCalculada.fallback
        ? 'Ruta mostrada como linea directa porque OSRM no respondio.'
        : 'Ruta calculada con OSRM y OpenStreetMap.'
      setMensajeRuta(mensaje)
      onMessage?.(mensaje)
    } catch (error) {
      setEstadoRuta('error')
      setMensajeRuta(error.message)
      onMessage?.(error.message)
    }
  }, [destinoTexto, onMessage, origenTexto, ubicacionActual])

  return {
    origenTexto,
    destinoTexto,
    origenRuta,
    destinoRuta,
    rutaPlanificada,
    resumenRuta,
    estadoRuta,
    mensajeRuta,
    origenSugerido,
    centrarRutaToken,
    setOrigenTexto,
    setDestinoTexto,
    usarUbicacionActualComoOrigen,
    calcularRuta,
    limpiarRuta,
  }
}