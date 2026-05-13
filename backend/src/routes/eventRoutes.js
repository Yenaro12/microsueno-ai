import { Router } from 'express'
import { createEventController, getEventsByTripController } from '../controllers/eventController.js'

const router = Router()

router.post('/', createEventController)
router.get('/:tripId', getEventsByTripController)

export default router
