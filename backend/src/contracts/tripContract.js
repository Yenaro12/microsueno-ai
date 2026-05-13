export function normalizeTripPayload(tripData = {}) {
  return {
    id: tripData.id,
    startedAt: tripData.startedAt || tripData.started_at || new Date().toISOString(),
    finishedAt: tripData.finishedAt || tripData.finished_at || null,
    status: tripData.status || 'active',
    driverId: tripData.driverId || tripData.driver_id || 'driver-sin-asignar',
    driverName: tripData.driverName || tripData.driver_name || 'Conductor sin asignar',
    driverEmail: tripData.driverEmail || tripData.driver_email || '',
    riskIndex: tripData.riskIndex ?? tripData.risk_index ?? null,
    distanceKm: tripData.distanceKm ?? tripData.distance_km ?? null,
  }
}
