import { Router } from 'express'
import {
  createTripController,
  finishTripController,
  getTripByIdController,
  getTripsController,
} from '../controllers/tripController.js'

const router = Router()

router.post('/', createTripController)
router.patch('/:id/finish', finishTripController)
router.get('/', getTripsController)
router.get('/:id', getTripByIdController)

export default router
