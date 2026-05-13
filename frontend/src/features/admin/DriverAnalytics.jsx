import KPICards from './KPICards'
import RiskTrendChart from './RiskTrendChart'
import RiskDoughnutChart from './RiskDoughnutChart'
import EventsBarChart from './EventsBarChart'
import HourHeatmap from './HourHeatmap'

function DriverAnalytics({ driverKPIs, driverTrend, driverByHour, driverByType, driverRecommendation, cargando }) {
  if (cargando) {
    return <div className="analytics-loading">Cargando analisis del conductor...</div>
  }

  if (!driverKPIs) {
    return <div className="analytics-empty-state">No hay datos disponibles para este conductor.</div>
  }

  const { driver, totalViajes, totalEventos, alertas, km, indiceRiesgo, horasPico } = driverKPIs

  const kpis = [
    { label: 'Viajes', value: totalViajes, color: '#1e40af' },
    { label: 'Eventos', value: totalEventos, color: '#3b82f6' },
    { label: 'Alertas', value: alertas, color: '#60a5fa' },
    { label: 'Kilometros', value: `${km} km`, color: '#0f172a' },
    {
      label: 'Nivel de riesgo',
      value: indiceRiesgo >= 70 ? 'Critico' : indiceRiesgo >= 40 ? 'Alto' : indiceRiesgo >= 15 ? 'Moderado' : 'Bajo',
      sub: `Probabilidad: ${indiceRiesgo}%`,
      color: indiceRiesgo >= 70 ? '#0f172a' : indiceRiesgo >= 40 ? '#1e40af' : '#3b82f6',
    },
  ]

  if (horasPico?.length > 0) {
    kpis.push({
      label: 'Horas pico',
      value: horasPico.map((h) => `${String(h.hour).padStart(2, '0')}:00`).join(' · '),
      color: '#475569',
    })
  }

  const doughnutData = driverByType
    ? {
        bajo: Math.max(0, totalEventos - alertas - Math.round(totalEventos * 0.2)),
        medio: Math.round(totalEventos * 0.2),
        alto: 0,
        alarma: alertas,
      }
    : null

  return (
    <div className="analytics-view">
      <div className="analytics-section-header">
        <h2>{driver?.driverName ?? 'Conductor'}</h2>
        <p>{driver?.driverEmail || 'Analisis individual de fatiga y comportamiento'}</p>
      </div>

      <KPICards items={kpis} />

      <div className="analytics-charts-row">
        <RiskTrendChart trend={driverTrend} titulo="Tendencia de riesgo por viaje" />
        <RiskDoughnutChart byType={doughnutData} titulo="Distribucion de niveles de riesgo" />
      </div>

      <div className="analytics-charts-row">
        <EventsBarChart byType={driverByType} titulo="Tipos de evento detectados" />
        <HourHeatmap byHour={driverByHour} titulo="Horas con mayor actividad de alerta" />
      </div>

      {driverRecommendation && (
        <article className="analytics-recommendation-card">
          <div className="analytics-recommendation-header">
            <span className="analytics-chart-title">Analisis de patrones</span>
            <small>Basado en datos historicos del conductor</small>
          </div>
          <div className="analytics-recommendation-body">
            {driverRecommendation.split('\n\n').map((parrafo, i) => (
              <p key={i}>{parrafo}</p>
            ))}
          </div>
        </article>
      )}
    </div>
  )
}

export default DriverAnalytics
