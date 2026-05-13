import { apiRequest } from './apiClient'
import { crearPayloadEventoBackend } from '../domain/eventContract'
import { guardarEventoSupabase } from './supabaseRealtimeService'

export const guardarEventoBackend = async (evento) => {
  const payload = crearPayloadEventoBackend(evento)

  guardarEventoSupabase(evento)
    .then((resultado) => {
      if (resultado.ok) console.log('Evento enviado a Supabase Realtime', evento.id)
    })
    .catch((error) => console.warn('Supabase no recibio el evento', error.message))

  return apiRequest('/events', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export const obtenerEventosPorViaje = (tripId) => apiRequest(`/events/${tripId}`)
