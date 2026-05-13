import { Router } from 'express'
import {
  fleetKPIs,
  topRiskDrivers,
  fleetEventsByHour,
  fleetEventsByType,
  fleetFinancialImpact,
  fleetGeoData,
  fleetOptimization,
  driverKPIs,
  driverRiskTrend,
  driverEventsByHour,
  driverEventsByType,
  driverRecommendation,
} from '../controllers/analyticsController.js'

const router = Router()

// Flota general
router.get('/fleet/kpis', fleetKPIs)
router.get('/fleet/top-risk-drivers', topRiskDrivers)
router.get('/fleet/events-by-hour', fleetEventsByHour)
router.get('/fleet/events-by-type', fleetEventsByType)
router.get('/fleet/financial-impact', fleetFinancialImpact)
router.get('/fleet/geo-data', fleetGeoData)
router.get('/fleet/optimization', fleetOptimization)

// Conductor individual
router.get('/driver/:id/kpis', driverKPIs)
router.get('/driver/:id/risk-trend', driverRiskTrend)
router.get('/driver/:id/events-by-hour', driverEventsByHour)
router.get('/driver/:id/events-by-type', driverEventsByType)
router.get('/driver/:id/recommendation', driverRecommendation)

export default router
