import {
  getFleetKPIs,
  getTopRiskDrivers,
  getFleetEventsByHour,
  getFleetEventsByType,
  getFleetFinancialImpact,
  getFleetGeoData,
  getDriverKPIs,
  getDriverRiskTrend,
  getDriverEventsByHour,
  getDriverEventsByType,
  getDriverRecommendation,
} from '../services/analyticsService.js'

const wrap = (fn) => async (req, res, next) => {
  try {
    const data = await fn(req, res)
    res.json({ ok: true, data })
  } catch (err) {
    next(err)
  }
}

export const fleetKPIs = wrap(async () => getFleetKPIs())

export const topRiskDrivers = wrap(async (req) => {
  const limit = Number(req.query.limit) || 10
  return getTopRiskDrivers(limit)
})

export const fleetEventsByHour = wrap(async () => getFleetEventsByHour())

export const fleetEventsByType = wrap(async () => getFleetEventsByType())

export const fleetFinancialImpact = wrap(async () => getFleetFinancialImpact())

export const fleetGeoData = wrap(async () => getFleetGeoData())

export const fleetOptimization = wrap(async () => {
  const { getOptimizationData } = await import('../services/optimizationService.js')
  return getOptimizationData()
})

export const driverKPIs = wrap(async (req) => getDriverKPIs(req.params.id))

export const driverRiskTrend = wrap(async (req) => getDriverRiskTrend(req.params.id))

export const driverEventsByHour = wrap(async (req) => getDriverEventsByHour(req.params.id))

export const driverEventsByType = wrap(async (req) => getDriverEventsByType(req.params.id))

export const driverRecommendation = wrap(async (req) => getDriverRecommendation(req.params.id))
