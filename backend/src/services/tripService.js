import { readStorage, updateStorage } from '../utils/fileStorage.js'
import { normalizeTripPayload } from '../contracts/tripContract.js'

const crearId = (prefijo) => `${prefijo}-${Date.now()}-${Math.random().toString(16).slice(2)}`

export async function createTrip(tripData = {}) {
  const payload = normalizeTripPayload(tripData)
  const trip = {
    id: payload.id || crearId('trip'),
    startedAt: payload.startedAt,
    finishedAt: null,
    status: payload.status,
    driverId: payload.driverId,
    driverName: payload.driverName,
    driverEmail: payload.driverEmail,
    riskIndex: null,
    distanceKm: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  await updateStorage((data) => {
    data.trips.push(trip)
    return data
  })

  return trip
}

export async function finishTrip(id, tripData = {}) {
  const payload = normalizeTripPayload(tripData)
  let tripActualizado = null

  await updateStorage((data) => {
    data.trips = data.trips.map((trip) => {
      if (trip.id !== id) return trip
      tripActualizado = {
        ...trip,
        finishedAt: payload.finishedAt || new Date().toISOString(),
        status: 'finished',
        driverId: payload.driverId || trip.driverId,
        driverName: payload.driverName || trip.driverName,
        driverEmail: payload.driverEmail || trip.driverEmail,
        riskIndex: Number(payload.riskIndex ?? trip.riskIndex ?? 0),
        distanceKm: Number(payload.distanceKm ?? trip.distanceKm ?? 0),
        updatedAt: new Date().toISOString(),
      }
      return tripActualizado
    })
    return data
  })

  return tripActualizado
}

export async function getTrips() {
  const data = await readStorage()
  return data.trips
}

export async function getTripById(id) {
  const data = await readStorage()
  return data.trips.find((trip) => trip.id === id) || null
}
