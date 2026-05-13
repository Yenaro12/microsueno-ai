function HourHeatmap({ byHour = [], titulo = 'Actividad por hora del dia' }) {
  if (!byHour || byHour.length === 0) {
    return (
      <article className="analytics-chart-card">
        <span className="analytics-chart-title">{titulo}</span>
        <div className="analytics-chart-empty">Sin datos horarios</div>
      </article>
    )
  }

  const maxCount = Math.max(...byHour.map((h) => h.count ?? 0), 1)

  const getColor = (count) => {
    if (count === 0) return 'rgba(37, 99, 235, 0.04)' /* Azul muy claro transparente */
    const intensity = count / maxCount
    if (intensity > 0.75) return 'rgba(15, 23, 42, 0.90)' /* Negro/Azul muy oscuro */
    if (intensity > 0.50) return 'rgba(30, 64, 175, 0.80)' /* Azul oscuro */
    if (intensity > 0.25) return 'rgba(59, 130, 246, 0.70)' /* Azul base */
    return 'rgba(147, 197, 253, 0.60)' /* Azul claro */
  }

  const periodos = [
    { label: 'Madrugada', range: [0, 5] },
    { label: 'Manana', range: [6, 11] },
    { label: 'Tarde', range: [12, 17] },
    { label: 'Noche', range: [18, 23] },
  ]

  return (
    <article className="analytics-chart-card analytics-heatmap-card">
      <span className="analytics-chart-title">{titulo}</span>
      <div className="analytics-heatmap">
        {periodos.map(({ label, range }) => (
          <div key={label} className="analytics-heatmap-period">
            <span className="analytics-heatmap-period-label">{label}</span>
            <div className="analytics-heatmap-cells">
              {byHour.slice(range[0], range[1] + 1).map((h) => (
                <div
                  key={h.hour}
                  className="analytics-heatmap-cell"
                  style={{ background: getColor(h.count) }}
                  title={`${String(h.hour).padStart(2, '0')}:00 — ${h.count} eventos`}
                >
                  <span className="analytics-heatmap-hour" style={{ color: h.count === 0 ? '#1e40af' : 'rgba(255,255,255,0.9)' }}>
                    {String(h.hour).padStart(2, '0')}
                  </span>
                  {h.count > 0 && <span className="analytics-heatmap-count">{h.count}</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="analytics-heatmap-legend">
        <span style={{ color: 'rgba(147, 197, 253, 0.9)' }}>Bajo</span>
        <span style={{ color: 'rgba(59, 130, 246, 0.9)' }}>Medio</span>
        <span style={{ color: 'rgba(30, 64, 175, 0.9)' }}>Alto</span>
        <span style={{ color: 'rgba(15, 23, 42, 0.9)' }}>Muy Alto</span>
      </div>
    </article>
  )
}

export default HourHeatmap
