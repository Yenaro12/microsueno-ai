import { apiRequest } from './apiClient'

export const crearViaje = (viaje) =>
  apiRequest('/trips', {
    method: 'POST',
    body: JSON.stringify(viaje),
  })

export const finalizarViajeBackend = (id, resumen) =>
  apiRequest(`/trips/${id}/finish`, {
    method: 'PATCH',
    body: JSON.stringify(resumen),
  })

export const obtenerViajes = () => apiRequest('/trips')
export const obtenerViajePorId = (id) => apiRequest(`/trips/${id}`)
