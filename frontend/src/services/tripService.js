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

  // 1. Guardar Viaje Finalizado en Supabase
  guardarViajeSupabase({ id, ...resumen, status: 'finished' })
    .then((resultado) => {
      if (resultado.ok) console.log('Cierre de viaje sincronizado con Supabase Realtime', id)
    })
    .catch((error) => console.warn('Supabase no recibio el cierre de viaje', error.message))

  // 2. Enviar Batch de eventos menores
  try {
    const batchKey = `trip_batch_${id}`
    const batchedEvents = JSON.parse(localStorage.getItem(batchKey) || '[]')
    if (batchedEvents.length > 0) {
      const { supabase } = await import('./supabaseClient')
      const { error } = await supabase.from('events').insert(batchedEvents)
      if (!error) {
        console.log(`Enviados ${batchedEvents.length} eventos en batch a Supabase.`)
        localStorage.removeItem(batchKey)
      } else {
        console.error('Error enviando batch a Supabase:', error)
      }
    }
  } catch (err) {
    console.error('Error procesando el batch de eventos local:', err)
  }

  return respuesta
}

export const obtenerViajes = () => apiRequest('/trips')
export const obtenerViajePorId = (id) => apiRequest(`/trips/${id}`)
