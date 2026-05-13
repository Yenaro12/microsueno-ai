import { apiRequest } from './apiClient.js'

// ── Flota ────────────────────────────────────────────────────────────────────
export const getFleetKPIs = () => apiRequest('/analytics/fleet/kpis')
export const getTopRiskDrivers = (limit = 10) =>
  apiRequest(`/analytics/fleet/top-risk-drivers?limit=${limit}`)
export const getFleetEventsByHour = () => apiRequest('/analytics/fleet/events-by-hour')
export const getFleetEventsByType = () => apiRequest('/analytics/fleet/events-by-type')
export const getFleetFinancialImpact = () => apiRequest('/analytics/fleet/financial-impact')
export const getFleetGeoData = () => apiRequest('/analytics/fleet/geo-data')
export const getFleetOptimization = () => apiRequest('/analytics/fleet/optimization')

// ── Conductor ────────────────────────────────────────────────────────────────
export const getDriverKPIs = (id) => apiRequest(`/analytics/driver/${encodeURIComponent(id)}/kpis`)
export const getDriverRiskTrend = (id) => apiRequest(`/analytics/driver/${encodeURIComponent(id)}/risk-trend`)
export const getDriverEventsByHour = (id) => apiRequest(`/analytics/driver/${encodeURIComponent(id)}/events-by-hour`)
export const getDriverEventsByType = (id) => apiRequest(`/analytics/driver/${encodeURIComponent(id)}/events-by-type`)
export const getDriverRecommendation = (id) => apiRequest(`/analytics/driver/${encodeURIComponent(id)}/recommendation`)
