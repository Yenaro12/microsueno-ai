import { getDriverSummary, getDriversForAdmin } from '../services/adminService.js'

export async function getDriversController(_req, res, next) {
  try {
    const drivers = await getDriversForAdmin()
    res.json(drivers)
  } catch (error) {
    next(error)
  }
}

export async function getDriverSummaryController(req, res, next) {
  try {
    const summary = await getDriverSummary(req.params.driverId)
    res.json(summary)
  } catch (error) {
    next(error)
  }
}
