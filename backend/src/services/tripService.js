import { readStorage, updateStorage } from '../utils/fileStorage.js'

const crearId = (prefijo) => `${prefijo}-${Date.now()}-${Math.random().toString(16).slice(2)}`

export async function createTrip({ startedAt, status = 'active' }) {
  const trip = {
    id: crearId('trip'),
    startedAt: startedAt || new Date().toISOString(),
    finishedAt: null,
    status,
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

export async function finishTrip(id, { finishedAt, riskIndex, distanceKm }) {
  let tripActualizado = null

  await updateStorage((data) => {
    data.trips = data.trips.map((trip) => {
      if (trip.id !== id) return trip
      tripActualizado = {
        ...trip,
        finishedAt: finishedAt || new Date().toISOString(),
        status: 'finished',
        riskIndex: Number(riskIndex ?? trip.riskIndex ?? 0),
        distanceKm: Number(distanceKm ?? trip.distanceKm ?? 0),
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
