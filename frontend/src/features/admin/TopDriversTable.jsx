function getRankLabel(i) {
  if (i === 0) return '1'
  if (i === 1) return '2'
  if (i === 2) return '3'
  return String(i + 1)
}

function getBadgeClass(indice) {
  if (indice >= 70) return 'badge-alarma'
  if (indice >= 40) return 'badge-alto'
  if (indice >= 15) return 'badge-medio'
  return 'badge-bajo'
}

function getBadgeLabel(indice) {
  if (indice >= 70) return 'Riesgo critico'
  if (indice >= 40) return 'Riesgo alto'
  if (indice >= 15) return 'Riesgo moderado'
  return 'Riesgo bajo'
}

function TopDriversTable({ drivers = [], onSeleccionar }) {
  if (!drivers || drivers.length === 0) {
    return (
      <article className="analytics-chart-card">
        <span className="analytics-chart-title">Ranking de conductores por riesgo</span>
        <div className="analytics-chart-empty">Sin conductores registrados</div>
      </article>
    )
  }

  return (
    <article className="analytics-chart-card">
      <span className="analytics-chart-title">Ranking de conductores por riesgo</span>
      <div className="analytics-table-wrapper">
        <table className="analytics-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Conductor</th>
              <th>Riesgo</th>
              <th>Eventos</th>
              <th>Alertas</th>
              <th>Km</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d, i) => (
              <tr key={d.driverId} className="analytics-table-row">
                <td className="analytics-rank">{getRankLabel(i)}</td>
                <td>
                  <div className="analytics-driver-name">{d.driverName}</div>
                  <div className="analytics-driver-email">{d.driverEmail || '—'}</div>
                </td>
                <td>
                  <span className={`analytics-badge ${getBadgeClass(d.indiceRiesgo)}`}>
                    {getBadgeLabel(d.indiceRiesgo)}
                  </span>
                </td>
                <td>{d.totalEventos}</td>
                <td>{d.alertas}</td>
                <td>{d.km}</td>
                <td>
                  {onSeleccionar && (
                    <button
                      type="button"
                      className="analytics-btn-ver"
                      onClick={() => onSeleccionar(d.driverId)}
                    >
                      Ver
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  )
}

export default TopDriversTable
