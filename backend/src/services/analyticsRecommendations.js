import { readStorage } from '../utils/fileStorage.js'
import { getDriverId, getHoraDeEvento, calcIndiceRiesgo, normNivel } from './analyticsHelpers.js'

const UMBRAL_NOCTURNO = 0.3
const UMBRAL_TENDENCIA = 15
const UMBRAL_ALERTAS_POR_KM = 2
const UMBRAL_CABEZA_ABAJO = 5
const UMBRAL_ROSTRO_PERDIDO = 3
const INDICE_RIESGO_ALTO = 70
const INDICE_RIESGO_MODERADO = 40

function analizarHorarioNocturno(events) {
  const nocturnos = events.filter((e) => {
    const h = getHoraDeEvento(e)
    return h !== null && h >= 0 && h <= 5
  })
  const pct = events.length > 0 ? nocturnos.length / events.length : 0
  if (pct <= UMBRAL_NOCTURNO) return null
  return `${Math.round(pct * 100)}% de los eventos ocurren entre las 12am y 5am. Se recomienda evitar turnos nocturnos o tomar descansos obligatorios cada 2 horas.`
}

function analizarTendenciaRiesgo(trips, events) {
  const viajes = trips
    .filter((t) => t.finishedAt)
    .sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt))
    .slice(-5)

  if (viajes.length < 3) return null

  const indices = viajes.map((t) => {
    const evs = events.filter((e) => e.tripId === t.id || e.idViaje === t.id)
    return calcIndiceRiesgo(evs)
  })

  const tendencia = indices[indices.length - 1] - indices[0]
  if (tendencia <= UMBRAL_TENDENCIA) return null
  return 'El indice de riesgo ha aumentado en los ultimos viajes. Se recomienda una evaluacion medica de fatiga y ajustar los horarios de trabajo.'
}

function analizarFrecuenciaAlertas(events, trips) {
  const km = trips.reduce((acc, t) => acc + Number(t.distanceKm || 0), 0)
  const alertasPorKm = km > 0 ? events.length / km : 0
  if (alertasPorKm <= UMBRAL_ALERTAS_POR_KM) return null
  return `Alta frecuencia de alertas (${alertasPorKm.toFixed(1)} por km). Verificar condiciones de manejo y estado fisico del conductor antes de cada turno.`
}

function analizarCabezaCaida(events) {
  const count = events.filter((e) => e.type === 'Cabeza abajo' || e.tipoEvento === 'Cabeza abajo').length
  if (count <= UMBRAL_CABEZA_ABAJO) return null
  return `Se detectaron ${count} eventos de cabeza caida. Se recomienda pausas activas de 10 a 15 minutos cada 2 horas de manejo continuo.`
}

function analizarRostroPerdido(events) {
  const count = events.filter((e) => e.type === 'Rostro perdido' || e.tipoEvento === 'Rostro perdido').length
  if (count <= UMBRAL_ROSTRO_PERDIDO) return null
  return `Frecuentes perdidas de deteccion facial (${count} eventos). Verificar posicion de la camara y condiciones de iluminacion del vehiculo.`
}

function analizarIndiceGlobal(indice) {
  if (indice >= INDICE_RIESGO_ALTO) {
    return 'Indice de riesgo global muy alto. Se recomienda suspension temporal de turnos y evaluacion integral del conductor.'
  }
  if (indice >= INDICE_RIESGO_MODERADO) {
    return 'Indice de riesgo moderado. Monitorear de cerca y limitar turnos de mas de 8 horas continuas.'
  }
  return null
}

export async function getDriverRecommendation(drId) {
  const { trips = [], events = [] } = await readStorage()
  const evs = events.filter((e) => getDriverId(e) === drId)
  const trps = trips.filter((t) => getDriverId(t) === drId)

  if (evs.length === 0) {
    return 'No hay suficientes datos para generar una recomendacion. Completa al menos un viaje.'
  }

  const analisis = [
    analizarHorarioNocturno(evs),
    analizarTendenciaRiesgo(trps, evs),
    analizarFrecuenciaAlertas(evs, trps),
    analizarCabezaCaida(evs),
    analizarRostroPerdido(evs),
    analizarIndiceGlobal(calcIndiceRiesgo(evs)),
  ].filter(Boolean)

  if (analisis.length === 0) {
    return 'El conductor muestra un buen perfil de seguridad. Mantener los habitos actuales y continuar el monitoreo preventivo.'
  }

  return analisis.join('\n\n')
}
