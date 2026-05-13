import { supabase } from '../config/supabaseClient.js'
import { cache } from '../config/cacheClient.js'
import { getDriverId } from './analyticsHelpers.js'

const RANGO_MAXIMO_SEGURO_BASE = 500
const PENALIZACION_RIESGO = 2

export async function getOptimizationData() {
  const cacheKey = 'optimization_data'
  const cachedData = cache.get(cacheKey)
  if (cachedData) return cachedData

  const { data: trips, error: errTrips } = await supabase.from('trips').select('*')
  const { data: events, error: errEvents } = await supabase.from('events').select('*')

  if (errTrips || errEvents) {
    console.error('Error fetching data from Supabase', errTrips || errEvents)
    return { conductores: [], optimizaciones: [] }
  }

  const driverMap = new Map()

  for (const t of (trips || [])) {
    const dId = t.driver_id || getDriverId(t)
    if (!driverMap.has(dId)) {
      driverMap.set(dId, {
        driverId: dId,
        driverName: t.driver_name || 'Desconocido',
        totalTrips: 0,
        kmRecorridos: 0,
        eventosTotales: 0,
        alertas: 0
      })
    }
    const d = driverMap.get(dId)
    d.totalTrips++
    d.kmRecorridos += Number(t.distance_km || 0)
  }

  for (const e of (events || [])) {
    const dId = e.driver_id || getDriverId(e)
    if (driverMap.has(dId)) {
      const d = driverMap.get(dId)
      d.eventosTotales++
      if (e.level && e.level.toLowerCase().includes('alarma')) {
        d.alertas++
      }
    }
  }

  const drivers = [...driverMap.values()].map(d => {
    const riesgo = d.kmRecorridos > 0 ? (d.alertas * 100) / d.kmRecorridos : 0
    const ecoSafetyScore = Math.max(0, 100 - (riesgo * 5))
    
    let rangoOptimo = RANGO_MAXIMO_SEGURO_BASE - (riesgo * PENALIZACION_RIESGO)
    if (rangoOptimo < 150) rangoOptimo = 150
    
    return {
      ...d,
      ecoSafetyScore: Number(ecoSafetyScore.toFixed(1)),
      rangoOptimoKm: Number(rangoOptimo.toFixed(0)),
      disponible: true
    }
  }).sort((a, b) => b.ecoSafetyScore - a.ecoSafetyScore)

  const pendingTrips = [
    { id: 'trip-pend-1', origin: 'CDMX', dest: 'Monterrey', distanceKm: 900, urgency: 'Alta' },
    { id: 'trip-pend-2', origin: 'Guadalajara', dest: 'Querétaro', distanceKm: 350, urgency: 'Media' },
    { id: 'trip-pend-3', origin: 'Puebla', dest: 'Tijuana', distanceKm: 2800, urgency: 'Alta' },
  ]

  const optimizaciones = pendingTrips.map(trip => {
    const candidatos = drivers.filter(d => d.disponible)
    
    if (trip.distanceKm > RANGO_MAXIMO_SEGURO_BASE * 1.2) {
      const numChoferes = Math.ceil(trip.distanceKm / RANGO_MAXIMO_SEGURO_BASE)
      const combo = candidatos.slice(0, numChoferes)
      return {
        ...trip,
        tipoAsignacion: combo.length > 0 ? 'Combo (Relevos)' : 'Sin Asignar',
        recomendados: combo,
        mensaje: combo.length > 0 ? `Ruta excede límite seguro. Se requiere combo de ${numChoferes} conductores.` : 'No hay conductores suficientes para esta ruta.'
      }
    } else {
      const aptos = candidatos.filter(c => c.rangoOptimoKm >= trip.distanceKm)
      let asignado = null;
      if (aptos.length > 0) asignado = aptos[0];
      else if (candidatos.length > 0) asignado = candidatos[0];
      
      const recomendados = asignado ? [asignado] : [];
      return {
        ...trip,
        tipoAsignacion: recomendados.length > 0 ? 'Individual' : 'Sin Asignar',
        recomendados,
        mensaje: aptos.length > 0 ? 'Conductor dentro de margen seguro.' : (recomendados.length > 0 ? 'Riesgo leve: El conductor excede su rango óptimo histórico.' : 'No hay conductores disponibles para asignar.')
      }
    }
  })

  const result = { conductores: drivers, optimizaciones }
  cache.set(cacheKey, result)
  return result
}
