import { readStorage } from '../utils/fileStorage.js'
import {
  normNivel,
  getDriverId,
  getDriverInfo,
  calcIndiceRiesgo,
  getHoraDeEvento,
  countEventsByType,
  buildHourDistribution,
} from './analyticsHelpers.js'

export async function getDriverKPIs(drId) {
  const { trips = [], events = [] } = await readStorage()
  const evs = events.filter((e) => getDriverId(e) === drId)
  const trps = trips.filter((t) => getDriverId(t) === drId)

  const km = trps.reduce((acc, t) => acc + Number(t.distanceKm || 0), 0)
  const alertas = evs.filter((e) => normNivel(e.level) === 'alarma').length
  const indiceRiesgo = calcIndiceRiesgo(evs)

  const porHora = Array(24).fill(0)
  evs.forEach((e) => {
    const h = getHoraDeEvento(e)
    if (h !== null) porHora[h]++
  })
  const horasPico = porHora
    .map((count, hour) => ({ hour, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .filter((h) => h.count > 0)

  return {
    driver: getDriverInfo(trps[0] || evs[0] || { driverId: drId }),
    totalViajes: trps.length,
    viajesActivos: trps.filter((t) => t.status === 'active').length,
    totalEventos: evs.length,
    alertas,
    km: Number(km.toFixed(2)),
    indiceRiesgo,
    horasPico,
  }
}

export async function getDriverRiskTrend(drId) {
  const { trips = [], events = [] } = await readStorage()
  const evs = events.filter((e) => getDriverId(e) === drId)
  const trps = trips
    .filter((t) => getDriverId(t) === drId && t.finishedAt)
    .sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt))
    .slice(-15)

  return trps.map((t) => {
    const tripEvents = evs.filter((e) => e.tripId === t.id || e.idViaje === t.id)
    return {
      tripId: t.id,
      fecha: t.startedAt,
      indiceRiesgo: calcIndiceRiesgo(tripEvents),
      totalEventos: tripEvents.length,
      alertas: tripEvents.filter((e) => normNivel(e.level) === 'alarma').length,
      km: Number(t.distanceKm || 0),
    }
  })
}

export async function getDriverEventsByHour(drId) {
  const { events = [] } = await readStorage()
  const evs = events.filter((e) => getDriverId(e) === drId)
  return buildHourDistribution(evs)
}

export async function getDriverEventsByType(drId) {
  const { events = [] } = await readStorage()
  const evs = events.filter((e) => getDriverId(e) === drId)
  return countEventsByType(evs)
}
