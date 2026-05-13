import { getEventsByTripId, saveEvent } from '../services/reportService.js'

export async function createEventController(req, res, next) {
  try {
    const event = await saveEvent(req.body || {})
    res.status(201).json(event)
  } catch (error) {
    next(error)
  }
}

export async function getEventsByTripController(req, res, next) {
  try {
    const events = await getEventsByTripId(req.params.tripId)
    res.json(events)
  } catch (error) {
    next(error)
  }
}
