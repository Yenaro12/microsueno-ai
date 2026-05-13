import { readStorage, updateStorage } from '../utils/fileStorage.js'
import { normalizeEventPayload } from '../contracts/eventContract.js'

const crearId = (prefijo) => `${prefijo}-${Date.now()}-${Math.random().toString(16).slice(2)}`

export async function saveEvent(eventData) {
  const payload = normalizeEventPayload(eventData)
  const event = {
    id: payload.id || crearId('event'),
    tripId: payload.tripId,
    driverId: payload.driverId,
    driverName: payload.driverName,
    driverEmail: payload.driverEmail,
    time: payload.time,
    readableTime: payload.readableTime || new Date(payload.time || Date.now()).toLocaleString('es-MX'),
    type: payload.type,
    level: payload.level,
    delta: payload.delta,
    duration: payload.duration,
    durationMs: payload.durationMs,
    lat: payload.lat,
    lng: payload.lng,
    riskIndex: payload.riskIndex,
    action: payload.action,
    source: payload.source,
    createdAt: new Date().toISOString(),
  }

  await updateStorage((data) => {
    data.events.push(event)
    return data
  })

  return event
}

export async function getEventsByTripId(tripId) {
  const data = await readStorage()
  return data.events.filter((event) => event.tripId === tripId)
}
