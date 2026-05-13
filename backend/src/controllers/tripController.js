import { createTrip, finishTrip, getTripById, getTrips } from '../services/tripService.js'

export async function createTripController(req, res, next) {
  try {
    const trip = await createTrip(req.body || {})
    res.status(201).json(trip)
  } catch (error) {
    next(error)
  }
}

export async function finishTripController(req, res, next) {
  try {
    const trip = await finishTrip(req.params.id, req.body || {})
    if (!trip) {
      res.status(404).json({ error: 'Viaje no encontrado' })
      return
    }
    res.json(trip)
  } catch (error) {
    next(error)
  }
}

export async function getTripsController(_req, res, next) {
  try {
    const trips = await getTrips()
    res.json(trips)
  } catch (error) {
    next(error)
  }
}

export async function getTripByIdController(req, res, next) {
  try {
    const trip = await getTripById(req.params.id)
    if (!trip) {
      res.status(404).json({ error: 'Viaje no encontrado' })
      return
    }
    res.json(trip)
  } catch (error) {
    next(error)
  }
}
