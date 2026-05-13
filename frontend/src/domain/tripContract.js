export const crearPayloadViajeBackend = (viaje = {}) => ({
  id: viaje.id,
  startedAt: viaje.startedAt || viaje.horaInicioViaje || new Date().toISOString(),
  finishedAt: viaje.finishedAt || viaje.horaFinViaje || null,
  status: viaje.status || 'active',
  driverId: viaje.driverId || 'driver-sin-asignar',
  driverName: viaje.driverName || 'Conductor sin asignar',
  driverEmail: viaje.driverEmail || '',
  riskIndex: viaje.riskIndex ?? null,
  distanceKm: viaje.distanceKm ?? null,
})

export const crearPayloadViajeSupabase = (viaje = {}) => {
  const payload = crearPayloadViajeBackend(viaje)
  return {
    id: payload.id,
    started_at: payload.startedAt,
    finished_at: payload.finishedAt,
    status: payload.status,
    driver_id: payload.driverId,
    driver_name: payload.driverName,
    driver_email: payload.driverEmail,
    risk_index: payload.riskIndex,
    distance_km: payload.distanceKm,
  }
}

export const normalizarViajeApi = (viaje = {}) => ({
  id: viaje.id,
  startedAt: viaje.startedAt || viaje.started_at || '',
  finishedAt: viaje.finishedAt || viaje.finished_at || null,
  status: viaje.status || 'active',
  driverId: viaje.driverId || viaje.driver_id || 'driver-sin-asignar',
  driverName: viaje.driverName || viaje.driver_name || 'Conductor sin asignar',
  driverEmail: viaje.driverEmail || viaje.driver_email || '',
  riskIndex: viaje.riskIndex ?? viaje.risk_index ?? null,
  distanceKm: viaje.distanceKm ?? viaje.distance_km ?? null,
})
