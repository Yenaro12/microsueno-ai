import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { STORAGE_KEYS, EVENT_TYPES } from '../utils/constants'
import { crearId, formatoFechaHora, formatoHora } from '../utils/formatters'
import { calcularIndiceRiesgo, clasificarRiesgo, obtenerRecomendacion } from '../utils/riskCalculator'
import { useLocalStorage } from './useLocalStorage'
import { crearViaje, finalizarViajeBackend } from '../services/tripService'
import { guardarEventoBackend } from '../services/eventService'
import { normalizarConductor } from '../utils/driverIdentity'

export function useTripSession({ ubicacionActual, distanciaKm, onMessage, conductor } = {}) {
  const [eventosDetectados, setEventosDetectados] = useLocalStorage(STORAGE_KEYS.EVENTOS_VIAJE, [])
  const eventosRef = useRef(eventosDetectados)
  const idViajeRef = useRef('')
  const horaInicioViajeRef = useRef('')
  const conductorRef = useRef(normalizarConductor(conductor))

  const [viajeActivo, setViajeActivo] = useState(false)
  const [idViaje, setIdViaje] = useState('')
  const [horaInicioViaje, setHoraInicioViaje] = useState('')
  const [horaFinViaje, setHoraFinViaje] = useState('')
  const [relojViaje, setRelojViaje] = useState(() => Date.now())

  useEffect(() => {
    eventosRef.current = eventosDetectados
  }, [eventosDetectados])

  useEffect(() => {
    conductorRef.current = normalizarConductor(conductor)
  }, [conductor])

  useEffect(() => {
    if (!viajeActivo) return undefined
    const intervalo = setInterval(() => setRelojViaje(Date.now()), 1000)
    return () => clearInterval(intervalo)
  }, [viajeActivo])

  const agregarEvento = useCallback((evento) => {
    setEventosDetectados((eventos) => [evento, ...eventos].slice(0, 200))
  }, [setEventosDetectados])

  const actualizarEvento = useCallback((idEvento, datos) => {
    if (!idEvento) return
    setEventosDetectados((eventos) =>
      eventos.map((evento) => {
        if (evento.id !== idEvento) return evento
        const actualizado = { ...evento, ...datos }
        return {
          ...actualizado,
          indiceRiesgoActual: calcularIndiceRiesgo([
            actualizado,
            ...eventos.filter((item) => item.id !== idEvento),
          ]),
        }
      }),
    )
  }, [setEventosDetectados])

  const registrarEvento = useCallback((datos) => {
    const fecha = new Date()
    const conductorActual = conductorRef.current
    const eventoBase = {
      id: crearId('evento'),
      idViaje: idViajeRef.current || idViaje || 'sin-viaje',
      horaInicioViaje: horaInicioViajeRef.current || horaInicioViaje,
      driverId: conductorActual.driverId,
      driverName: conductorActual.driverName,
      driverEmail: conductorActual.driverEmail,
      horaEvento: formatoHora(fecha),
      fechaHoraEvento: formatoFechaHora(fecha),
      fechaEventoISO: fecha.toISOString(),
      tipoEvento: datos.tipoEvento,
      nivel: datos.nivel,
      desplazamiento: datos.desplazamiento,
      duracionMs: datos.duracionMs,
      latitud: ubicacionActual?.latitud ?? null,
      longitud: ubicacionActual?.longitud ?? null,
      accion: datos.accion,
    }
    eventoBase.indiceRiesgoActual = calcularIndiceRiesgo([eventoBase, ...eventosRef.current])
    agregarEvento(eventoBase)

    guardarEventoBackend(eventoBase).then((resultado) => {
      if (resultado.ok) {
        console.log('Evento guardado en backend', resultado.data)
      } else {
        console.warn('Backend no disponible; evento guardado solo localmente', resultado.error?.message)
      }
    })

    return eventoBase.id
  }, [agregarEvento, horaInicioViaje, idViaje, ubicacionActual])

  const iniciarViaje = useCallback(async ({ desbloquearAudio, iniciarSeguimientoGps, iniciarCamara, resetRuta } = {}) => {
    if (viajeActivo) return
    const fechaInicio = new Date()
    const fallbackId = crearId('viaje')
    const conductorActual = conductorRef.current
    let idBackend = fallbackId

    await desbloquearAudio?.()
    resetRuta?.()
    eventosRef.current = []
    setEventosDetectados([])

    const respuesta = await crearViaje({
      id: fallbackId,
      startedAt: fechaInicio.toISOString(),
      status: 'active',
      ...conductorActual,
    })

    if (respuesta.ok && respuesta.data?.id) {
      idBackend = respuesta.data.id
      console.log('Viaje creado en backend', respuesta.data)
    } else {
      console.warn('Backend no disponible; viaje iniciado localmente', respuesta.error?.message)
    }

    idViajeRef.current = idBackend
    horaInicioViajeRef.current = fechaInicio.toISOString()
    setIdViaje(idBackend)
    setHoraInicioViaje(fechaInicio.toISOString())
    setHoraFinViaje('')
    setViajeActivo(true)
    iniciarSeguimientoGps?.()
    await iniciarCamara?.()
    onMessage?.('Viaje activo. GPS y analisis facial en ejecucion.')
  }, [onMessage, setEventosDetectados, viajeActivo])

  const obtenerAnalisisViaje = useCallback((tiempoEventoActual = 0) => {
    const eventos = eventosDetectados
    const inicio = horaInicioViaje ? new Date(horaInicioViaje).getTime() : null
    const fin = horaFinViaje ? new Date(horaFinViaje).getTime() : relojViaje
    const duracionViajeMs = inicio ? Math.max(0, fin - inicio) : 0
    const totalEventos = eventos.length
    const eventosCabezaAbajo = eventos.filter((evento) => evento.tipoEvento === EVENT_TYPES.CABEZA_ABAJO).length
    const eventosCabezaArriba = eventos.filter((evento) => evento.tipoEvento === EVENT_TYPES.CABEZA_ARRIBA).length
    const eventosRostroPerdido = eventos.filter((evento) => evento.tipoEvento === EVENT_TYPES.ROSTRO_PERDIDO).length
    const eventosNarizNoDetectada = eventos.filter((evento) => evento.tipoEvento === EVENT_TYPES.NARIZ_NO_DETECTADA).length
    const duracionTotal = eventos.reduce((total, evento) => total + (evento.duracionMs || 0), 0)
    const duracionMaxima = Math.max(
      tiempoEventoActual,
      eventos.reduce((maximo, evento) => Math.max(maximo, evento.duracionMs || 0), 0),
    )
    const duracionPromedio = totalEventos ? duracionTotal / totalEventos : 0
    const alertasPorKm = distanciaKm > 0 ? totalEventos / distanciaKm : 0
    const indiceRiesgo = calcularIndiceRiesgo(eventos)

    return {
      duracionViajeMs,
      totalEventos,
      eventosCabezaAbajo,
      eventosCabezaArriba,
      eventosRostroPerdido,
      eventosNarizNoDetectada,
      duracionMaxima,
      duracionPromedio,
      kilometros: distanciaKm || 0,
      alertasPorKm,
      indiceRiesgo,
      clasificacion: clasificarRiesgo(indiceRiesgo),
      recomendacion: obtenerRecomendacion(indiceRiesgo),
    }
  }, [distanciaKm, eventosDetectados, horaFinViaje, horaInicioViaje, relojViaje])

  const finalizarViaje = useCallback(async ({ detenerSeguimientoGps, detenerAlarma, finalizarEventoActual, tiempoEventoActual } = {}) => {
    if (!viajeActivo) return
    const fechaFin = new Date().toISOString()
    setHoraFinViaje(fechaFin)
    setViajeActivo(false)
    detenerSeguimientoGps?.()
    finalizarEventoActual?.(performance.now())
    detenerAlarma?.()

    const analisis = obtenerAnalisisViaje(tiempoEventoActual)
    const respuesta = await finalizarViajeBackend(idViajeRef.current || idViaje, {
      startedAt: horaInicioViajeRef.current || horaInicioViaje,
      finishedAt: fechaFin,
      riskIndex: analisis.indiceRiesgo,
      distanceKm: Number((distanciaKm || 0).toFixed(3)),
      ...conductorRef.current,
    })

    if (respuesta.ok) {
      console.log('Viaje finalizado en backend', respuesta.data)
    } else {
      console.warn('Backend no disponible; cierre de viaje guardado solo localmente', respuesta.error?.message)
    }

    onMessage?.('Viaje finalizado. Reporte listo para exportar.')
  }, [distanciaKm, horaInicioViaje, idViaje, obtenerAnalisisViaje, onMessage, viajeActivo])

  const limpiarEventos = useCallback(() => {
    eventosRef.current = []
    setEventosDetectados([])
    localStorage.removeItem(STORAGE_KEYS.EVENTOS_VIAJE)
  }, [setEventosDetectados])

  const analisisBase = useMemo(() => obtenerAnalisisViaje(0), [obtenerAnalisisViaje])

  return {
    viajeActivo,
    idViaje,
    horaInicioViaje,
    horaFinViaje,
    eventosDetectados,
    analisisBase,
    iniciarViaje,
    finalizarViaje,
    registrarEvento,
    actualizarEvento,
    obtenerAnalisisViaje,
    limpiarEventos,
  }
}



