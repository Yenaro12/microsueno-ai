import { crearPayloadViajeBackend } from '../domain/tripContract'
import { apiRequest } from './apiClient'
import { guardarViajeSupabase } from './supabaseRealtimeService'

export const crearViaje = async (viaje) => {
  const payload = crearPayloadViajeBackend(viaje)
  const respuesta = await apiRequest('/trips', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  guardarViajeSupabase(respuesta.data || payload)
    .then((resultado) => {
      if (resultado.ok) console.log('Viaje sincronizado con Supabase Realtime', payload.id)
    })
    .catch((error) => console.warn('Supabase no recibio el viaje', error.message))

  return respuesta
}

export const finalizarViajeBackend = async (id, resumen) => {
  const respuesta = await apiRequest(`/trips/${id}/finish`, {
    method: 'PATCH',
    body: JSON.stringify(resumen),
  })

  guardarViajeSupabase({ id, ...resumen, status: 'finished' })
    .then((resultado) => {
      if (resultado.ok) console.log('Cierre de viaje sincronizado con Supabase Realtime', id)
    })
    .catch((error) => console.warn('Supabase no recibio el cierre de viaje', error.message))

  return respuesta
}

export const obtenerViajes = () => apiRequest('/trips')
export const obtenerViajePorId = (id) => apiRequest(`/trips/${id}`)
