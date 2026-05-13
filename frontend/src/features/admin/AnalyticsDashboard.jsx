import { useAnalytics } from '../../hooks/useAnalytics'
import FleetOverview from './FleetOverview'
import DriverAnalytics from './DriverAnalytics'

function AnalyticsDashboard({ driverId = '', onSeleccionarConductor }) {
  const {
    fleetKPIs,
    topDrivers,
    fleetByHour,
    fleetByType,
    fleetFinancial,
    fleetGeo,
    driverKPIs,
    driverTrend,
    driverByHour,
    driverByType,
    driverRecommendation,
    cargando,
    refrescar,
  } = useAnalytics(driverId)

  return (
    <div className="analytics-dashboard">
      <div className="analytics-dashboard-toolbar">
        <h2 className="analytics-dashboard-title">
          {driverId ? 'Análisis de conductor' : 'Dashboard de análisis'}
        </h2>
        <button type="button" className="analytics-btn-refresh" onClick={refrescar} disabled={cargando}>
          {cargando ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {driverId ? (
        <DriverAnalytics
          driverKPIs={driverKPIs}
          driverTrend={driverTrend}
          driverByHour={driverByHour}
          driverByType={driverByType}
          driverRecommendation={driverRecommendation}
          cargando={cargando}
        />
      ) : (
        <FleetOverview
          fleetKPIs={fleetKPIs}
          topDrivers={topDrivers}
          fleetByHour={fleetByHour}
          fleetByType={fleetByType}
          fleetFinancial={fleetFinancial}
          fleetGeo={fleetGeo}
          cargando={cargando}
          onSeleccionarConductor={onSeleccionarConductor}
        />
      )}
    </div>
  )
}

export default AnalyticsDashboard
