import { apiRequest } from './apiClient'
import { crearPayloadEventoBackend } from '../domain/eventContract'
import { guardarEventoSupabase } from './supabaseRealtimeService'

export const guardarEventoBackend = async (evento) => {
  const isCritical = evento.level === 'alarma' || evento.level === 'moderado'
  
  if (isCritical) {
    // Solo enviar eventos peligrosos por Realtime
    guardarEventoSupabase(evento)
      .then((resultado) => {
        if (resultado.ok) console.log('Emergencia enviada a Supabase Realtime', evento.id)
      })
      .catch((error) => console.warn('Supabase no recibio el evento crítico', error.message))
  }

  // Acumular en LocalStorage para Batch
  const batchKey = `trip_batch_${evento.tripId}`
  const currentBatch = JSON.parse(localStorage.getItem(batchKey) || '[]')
  currentBatch.push(crearPayloadEventoBackend(evento))
  localStorage.setItem(batchKey, JSON.stringify(currentBatch))

  return { ok: true, batched: true }
}

export const obtenerEventosPorViaje = (tripId) => apiRequest(`/events/${tripId}`)
