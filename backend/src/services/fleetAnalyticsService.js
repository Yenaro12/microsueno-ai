import { supabase } from '../config/supabaseClient.js'
import { cache } from '../config/cacheClient.js'
import {
  normNivel,
  getDriverId,
  calcIndiceRiesgo,
  getFechaHoy,
  buildConductorMap,
  countEventsByType,
  buildHourDistribution,
} from './analyticsHelpers.js'

async function getSupabaseDataCached() {
  const cacheKey = 'fleet_analytics_data'
  const cached = cache.get(cacheKey)
  if (cached) return cached

  const { data: trips, error: errTrips } = await supabase.from('trips').select('*')
  const { data: events, error: errEvents } = await supabase.from('events').select('*')

  if (errTrips || errEvents) {
    console.error('Error fetching data from Supabase', errTrips || errEvents)
    return { trips: [], events: [] }
  }

  const result = { trips: trips || [], events: events || [] }
  cache.set(cacheKey, result)
  return result
}

export async function getFleetKPIs() {
  const { trips = [], events = [] } = await getSupabaseDataCached()
  const hoyStr = getFechaHoy()

  const alertasHoy = events.filter((e) => {
    const iso = e.event_time || e.created_at || ''
    return iso.startsWith(hoyStr) && normNivel(e.level) === 'alarma'
  }).length

  const kmTotales = trips.reduce((acc, t) => acc + Number(t.distance_km || 0), 0)
  const conductorMap = buildConductorMap(trips, events)
  const conductores = [...conductorMap.values()]

  let conductorMasRiesgoso = null
  let maxRiesgo = -1
  for (const c of conductores) {
    const evs = events.filter((e) => getDriverId(e) === c.driverId)
    const idx = calcIndiceRiesgo(evs)
    if (idx > maxRiesgo) {
      maxRiesgo = idx
      conductorMasRiesgoso = { ...c, indiceRiesgo: idx }
    }
  }

  return {
    totalConductores: conductores.length,
    totalViajes: trips.length,
    viajesActivos: trips.filter((t) => t.status === 'active').length,
    totalEventos: events.length,
    alertasHoy,
    kmTotales: Number(kmTotales.toFixed(2)),
    conductorMasRiesgoso,
  }
}

export async function getTopRiskDrivers(limit = 10) {
  const { trips = [], events = [] } = await getSupabaseDataCached()
  const conductorMap = buildConductorMap(trips, events)

  const result = [...conductorMap.values()].map((c) => {
    const evs = events.filter((e) => getDriverId(e) === c.driverId)
    const trps = trips.filter((t) => getDriverId(t) === c.driverId)
    const alertas = evs.filter((e) => normNivel(e.level) === 'alarma').length
    const km = trps.reduce((acc, t) => acc + Number(t.distance_km || 0), 0)
    return {
      ...c,
      indiceRiesgo: calcIndiceRiesgo(evs),
      totalEventos: evs.length,
      totalViajes: trps.length,
      alertas,
      km: Number(km.toFixed(2)),
    }
  })

  return result.sort((a, b) => b.indiceRiesgo - a.indiceRiesgo).slice(0, limit)
}

export async function getFleetEventsByHour() {
  const { events = [] } = await getSupabaseDataCached()
  return buildHourDistribution(events)
}

export async function getFleetEventsByType() {
  const { events = [] } = await getSupabaseDataCached()
  return countEventsByType(events)
}

export async function getFleetFinancialImpact() {
  const { events = [], trips = [] } = await getSupabaseDataCached()
  // Costo logistico estimado (ficticio para demostracion)
  const costoPorAlarma = 250 // $250 por alerta critica (desgaste, retraso, riesgo)
  const costoPorEventoLeve = 15 // $15 por evento menor (distraccion)
  
  let costoTotalEstimado = 0
  events.forEach(e => {
    if (normNivel(e.level) === 'alarma') costoTotalEstimado += costoPorAlarma
    else costoTotalEstimado += costoPorEventoLeve
  })

  // Eco-Safety Score (basado en eventos por km)
  const kmTotales = trips.reduce((acc, t) => acc + Number(t.distance_km || 0), 0)
  const tasaEventos = kmTotales > 0 ? (events.length / kmTotales) : 0
  const ecoSafetyScore = Math.max(0, 100 - (tasaEventos * 100))

  return {
    costoEstimadoRiesgo: costoTotalEstimado,
    ecoSafetyScore: Number(ecoSafetyScore.toFixed(1)),
    totalEventos: events.length
  }
}

export async function getFleetGeoData() {
  const { events = [] } = await getSupabaseDataCached()
  return events
    .filter(e => e.lat && e.lng)
    .map(e => ({
      id: e.id || Date.now().toString(),
      lat: e.lat,
      lng: e.lng,
      level: normNivel(e.level),
      type: e.type || 'Evento',
      driverName: e.driver_name || 'Conductor'
    }))
}
