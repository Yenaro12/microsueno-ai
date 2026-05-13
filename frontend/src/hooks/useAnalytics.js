import { useCallback, useEffect, useState } from 'react'
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
} from '../services/analyticsService'

const estadoInicial = {
  fleetKPIs: null,
  topDrivers: [],
  fleetByHour: [],
  fleetByType: null,
  fleetFinancial: null,
  fleetGeo: [],
  driverKPIs: null,
  driverTrend: [],
  driverByHour: [],
  driverByType: null,
  driverRecommendation: '',
  cargando: false,
  error: null,
}

export function useAnalytics(driverId = '') {
  const [estado, setEstado] = useState(estadoInicial)

  const cargar = useCallback(async () => {
    setEstado((s) => ({ ...s, cargando: true, error: null }))

    // Siempre cargar datos de flota
    const [kpisRes, topRes, horasRes, tiposRes, finRes, geoRes] = await Promise.all([
      getFleetKPIs(),
      getTopRiskDrivers(10),
      getFleetEventsByHour(),
      getFleetEventsByType(),
      getFleetFinancialImpact(),
      getFleetGeoData(),
    ])

    const fleetKPIs = kpisRes.ok ? kpisRes.data?.data ?? kpisRes.data : null
    const topDrivers = topRes.ok ? topRes.data?.data ?? topRes.data ?? [] : []
    const fleetByHour = horasRes.ok ? horasRes.data?.data ?? horasRes.data ?? [] : []
    const fleetByType = tiposRes.ok ? tiposRes.data?.data ?? tiposRes.data : null
    const fleetFinancial = finRes.ok ? finRes.data?.data ?? finRes.data : null
    const fleetGeo = geoRes.ok ? geoRes.data?.data ?? geoRes.data ?? [] : []

    if (!driverId) {
      setEstado((s) => ({
        ...s,
        fleetKPIs,
        topDrivers,
        fleetByHour,
        fleetByType,
        fleetFinancial,
        fleetGeo,
        driverKPIs: null,
        driverTrend: [],
        driverByHour: [],
        driverByType: null,
        driverRecommendation: '',
        cargando: false,
      }))
      return
    }

    // Cargar datos del conductor seleccionado
    const [dKPIs, dTrend, dHoras, dTipos, dRec] = await Promise.all([
      getDriverKPIs(driverId),
      getDriverRiskTrend(driverId),
      getDriverEventsByHour(driverId),
      getDriverEventsByType(driverId),
      getDriverRecommendation(driverId),
    ])

    setEstado((s) => ({
      ...s,
      fleetKPIs,
      topDrivers,
      fleetByHour,
      fleetByType,
      fleetFinancial,
      fleetGeo,
      driverKPIs: dKPIs.ok ? dKPIs.data?.data ?? dKPIs.data : null,
      driverTrend: dTrend.ok ? dTrend.data?.data ?? dTrend.data ?? [] : [],
      driverByHour: dHoras.ok ? dHoras.data?.data ?? dHoras.data ?? [] : [],
      driverByType: dTipos.ok ? dTipos.data?.data ?? dTipos.data : null,
      driverRecommendation: dRec.ok ? dRec.data?.data ?? dRec.data ?? '' : '',
      cargando: false,
    }))
  }, [driverId])

  useEffect(() => {
    cargar()
  }, [cargar])

  return { ...estado, refrescar: cargar }
}
