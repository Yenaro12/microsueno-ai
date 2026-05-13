import KPICards from './KPICards'
import EventsBarChart from './EventsBarChart'
import HourHeatmap from './HourHeatmap'
import TopDriversTable from './TopDriversTable'
import FinancialImpactChart from './FinancialImpactChart'
import RouteRiskMap from './RouteRiskMap'

function FleetOverview({ fleetKPIs, topDrivers, fleetByHour, fleetByType, fleetFinancial, fleetGeo, cargando, onSeleccionarConductor }) {
  const kpis = [
    { label: 'Conductores', value: fleetKPIs?.totalConductores ?? '—', color: '#0f172a' },
    { label: 'Total viajes', value: fleetKPIs?.totalViajes ?? '—', color: '#1e40af' },
    { label: 'Viajes activos', value: fleetKPIs?.viajesActivos ?? '—', color: '#2563eb' },
    { label: 'Total eventos', value: fleetKPIs?.totalEventos ?? '—', color: '#3b82f6' },
    { label: 'Alertas hoy', value: fleetKPIs?.alertasHoy ?? '—', color: '#60a5fa' },
    {
      label: 'Km totales',
      value: fleetKPIs?.kmTotales != null ? `${fleetKPIs.kmTotales} km` : '—',
      color: '#0f172a',
    },
  ]

  const conductorRiesgoso = fleetKPIs?.conductorMasRiesgoso
  if (conductorRiesgoso) {
    kpis.push({
      label: 'Mayor riesgo actual',
      value: `${conductorRiesgoso.indiceRiesgo}%`,
      sub: conductorRiesgoso.driverName,
      color: '#000000',
    })
  }

  if (cargando) {
    return <div className="analytics-loading">Cargando datos de flota...</div>
  }

  return (
    <div className="analytics-view">
      <div className="analytics-section-header">
        <h2>Vista general de flota</h2>
        <p>Metricas globales de todos los conductores registrados</p>
      </div>

      <FinancialImpactChart financialData={fleetFinancial} />

      <KPICards items={kpis} />

      <div className="analytics-charts-row">
        <RouteRiskMap geoData={fleetGeo} />
        <EventsBarChart byType={fleetByType} titulo="Tipos de evento — Flota completa" />
      </div>

      <div className="analytics-charts-row">
        <HourHeatmap byHour={fleetByHour} titulo="Horas pico de alertas — Flota completa" />
        <TopDriversTable drivers={topDrivers} onSeleccionar={onSeleccionarConductor} />
      </div>
    </div>
  )
}

export default FleetOverview
