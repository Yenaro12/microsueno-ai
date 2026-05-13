export const normalizarNivelEvento = (nivel = '') => String(nivel || '').trim().toLowerCase()

export const crearPayloadEventoBackend = (evento = {}) => ({
  id: evento.id,
  tripId: evento.idViaje || evento.tripId || 'sin-viaje',
  driverId: evento.driverId || 'driver-sin-asignar',
  driverName: evento.driverName || 'Conductor sin asignar',
  driverEmail: evento.driverEmail || '',
  time: evento.fechaEventoISO || evento.time || new Date().toISOString(),
  readableTime: evento.fechaHoraEvento || evento.readableTime || evento.horaEvento || '',
  type: evento.tipoEvento || evento.type || 'Evento',
  level: normalizarNivelEvento(evento.nivel || evento.level),
  delta: Number(evento.desplazamiento ?? evento.delta ?? 0),
  duration: Number(((evento.duracionMs ?? (evento.duration || 0) * 1000) / 1000).toFixed(2)),
  durationMs: Number(evento.duracionMs ?? (evento.duration || 0) * 1000),
  lat: evento.latitud ?? evento.lat ?? null,
  lng: evento.longitud ?? evento.lng ?? null,
  riskIndex: Number(evento.indiceRiesgoActual ?? evento.riskIndex ?? 0),
  action: evento.accion || evento.action || '',
  source: 'frontend',
})

export const crearPayloadEventoSupabase = (evento = {}) => {
  const payload = crearPayloadEventoBackend(evento)
  return {
    id: payload.id,
    trip_id: payload.tripId,
    driver_id: payload.driverId,
    driver_name: payload.driverName,
    driver_email: payload.driverEmail,
    event_time: payload.time,
    readable_time: payload.readableTime,
    type: payload.type,
    level: payload.level,
    delta: payload.delta,
    duration_seconds: payload.duration,
    duration_ms: payload.durationMs,
    lat: payload.lat,
    lng: payload.lng,
    risk_index: payload.riskIndex,
    action: payload.action,
    source: payload.source,
  }
}

export const normalizarEventoApi = (evento = {}) => ({
  id: evento.id,
  idViaje: evento.idViaje || evento.tripId || evento.trip_id || 'sin-viaje',
  driverId: evento.driverId || evento.driver_id || 'driver-sin-asignar',
  driverName: evento.driverName || evento.driver_name || 'Conductor sin asignar',
  driverEmail: evento.driverEmail || evento.driver_email || '',
  fechaEventoISO: evento.fechaEventoISO || evento.time || evento.event_time || evento.createdAt || '',
  fechaHoraEvento: evento.fechaHoraEvento || evento.readableTime || evento.readable_time || '',
  tipoEvento: evento.tipoEvento || evento.type || 'Evento',
  nivel: normalizarNivelEvento(evento.nivel || evento.level),
  desplazamiento: Number(evento.desplazamiento ?? evento.delta ?? 0),
  duracionMs: Number(evento.duracionMs ?? evento.durationMs ?? evento.duration_ms ?? (evento.duration || evento.duration_seconds || 0) * 1000),
  latitud: evento.latitud ?? evento.lat ?? null,
  longitud: evento.longitud ?? evento.lng ?? null,
  indiceRiesgoActual: Number(evento.indiceRiesgoActual ?? evento.riskIndex ?? evento.risk_index ?? 0),
  accion: evento.accion || evento.action || '',
})
