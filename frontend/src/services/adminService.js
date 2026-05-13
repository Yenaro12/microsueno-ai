import { normalizarEventoApi } from '../domain/eventContract'
import { normalizarViajeApi } from '../domain/tripContract'
import { apiRequest } from './apiClient'

const normalizarResumen = (data = {}) => ({
  driver: data.driver || null,
  trips: (data.trips || []).map(normalizarViajeApi),
  events: (data.events || []).map(normalizarEventoApi),
  latestAlerts: (data.latestAlerts || []).map(normalizarEventoApi),
  stats: data.stats || {},
})

export const obtenerConductoresAdmin = async () => {
  const respuesta = await apiRequest('/admin/drivers')
  if (!respuesta.ok) return respuesta
  return {
    ok: true,
    data: respuesta.data || [],
  }
}

export const obtenerResumenConductorAdmin = async (driverId) => {
  const respuesta = await apiRequest(`/admin/drivers/${encodeURIComponent(driverId)}/summary`)
  if (!respuesta.ok) return respuesta
  return {
    ok: true,
    data: normalizarResumen(respuesta.data),
  }
}
