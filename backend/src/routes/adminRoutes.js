import { Router } from 'express'
import { getDriverSummaryController, getDriversController } from '../controllers/adminController.js'

const router = Router()

router.get('/drivers', getDriversController)
router.get('/drivers/:driverId/summary', getDriverSummaryController)

export default router
