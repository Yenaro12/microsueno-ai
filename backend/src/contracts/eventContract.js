const normalizarNivelEvento = (nivel = '') => String(nivel || '').trim().toLowerCase()

export function normalizeEventPayload(eventData = {}) {
  const durationSeconds = Number(eventData.duration ?? eventData.duration_seconds ?? 0)
  const durationMs = Number(eventData.durationMs ?? eventData.duration_ms ?? durationSeconds * 1000)

  return {
    id: eventData.id,
    tripId: eventData.tripId || eventData.trip_id || 'sin-viaje',
    driverId: eventData.driverId || eventData.driver_id || 'driver-sin-asignar',
    driverName: eventData.driverName || eventData.driver_name || 'Conductor sin asignar',
    driverEmail: eventData.driverEmail || eventData.driver_email || '',
    time: eventData.time || eventData.event_time || new Date().toISOString(),
    readableTime: eventData.readableTime || eventData.readable_time || '',
    type: eventData.type || 'Evento',
    level: normalizarNivelEvento(eventData.level),
    delta: Number(eventData.delta ?? 0),
    duration: Number((durationMs / 1000).toFixed(2)),
    durationMs,
    lat: eventData.lat ?? null,
    lng: eventData.lng ?? null,
    riskIndex: Number(eventData.riskIndex ?? eventData.risk_index ?? 0),
    action: eventData.action || '',
    source: eventData.source || 'frontend',
  }
}
