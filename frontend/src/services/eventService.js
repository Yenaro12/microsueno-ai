import { apiRequest } from './apiClient'

export const guardarEventoBackend = (evento) =>
  apiRequest('/events', {
    method: 'POST',
    body: JSON.stringify({
      id: evento.id,
      tripId: evento.idViaje,
      time: evento.fechaEventoISO,
      type: evento.tipoEvento,
      level: String(evento.nivel || '').toUpperCase(),
      delta: evento.desplazamiento,
      duration: Number(((evento.duracionMs || 0) / 1000).toFixed(2)),
      lat: evento.latitud,
      lng: evento.longitud,
      riskIndex: evento.indiceRiesgoActual,
      action: evento.accion,
    }),
  })

export const obtenerEventosPorViaje = (tripId) => apiRequest(`/events/${tripId}`)
