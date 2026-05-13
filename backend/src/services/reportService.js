import { readStorage, updateStorage } from '../utils/fileStorage.js'

const crearId = (prefijo) => `${prefijo}-${Date.now()}-${Math.random().toString(16).slice(2)}`

export async function saveEvent(eventData) {
  const event = {
    id: eventData.id || crearId('event'),
    tripId: eventData.tripId || 'sin-viaje',
    time: eventData.time || new Date().toISOString(),
    readableTime: eventData.readableTime || new Date(eventData.time || Date.now()).toLocaleString('es-MX'),
    type: eventData.type,
    level: eventData.level,
    delta: Number(eventData.delta ?? 0),
    duration: Number(eventData.duration ?? 0),
    lat: eventData.lat ?? null,
    lng: eventData.lng ?? null,
    riskIndex: Number(eventData.riskIndex ?? 0),
    action: eventData.action || '',
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