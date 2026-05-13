import { claseIndiceRiesgo, obtenerRecomendacion } from '../../utils/riskCalculator'
import { formatoDuracionEvento, formatoNumero } from '../../utils/formatters'

const metricas = [
  ['Viajes', 'totalViajes'],
  ['Viajes activos', 'viajesActivos'],
  ['Eventos', 'totalEventos'],
  ['Alertas', 'alertas'],
  ['Cabeza abajo', 'eventosCabezaAbajo'],
  ['Cabeza arriba', 'eventosCabezaArriba'],
  ['Rostro perdido', 'eventosRostroPerdido'],
  ['Nariz no detectada', 'eventosNarizNoDetectada'],
]

function AdminDriverPanel({ resumen }) {
  if (!resumen?.driver) {
    return (
      <section className="admin-card admin-empty">
        <h2>Sin empleado seleccionado</h2>
        <p>Selecciona un conductor para visualizar alertas, viajes y estadisticas.</p>
      </section>
    )
  }

  const { driver, stats = {}, latestAlerts = [] } = resumen
  const indice = Number(stats.indiceRiesgo || 0)

  return (
    <section className="admin-panel">
      <article className="admin-card admin-driver-summary">
        <div>
          <span className="admin-label">Conductor</span>
          <h2>{driver.driverName}</h2>
          <p>{driver.driverEmail || 'Correo no registrado'}</p>
        </div>
        <strong className={`admin-risk ${claseIndiceRiesgo(indice)}`}>{indice}/100</strong>
      </article>

      <section className="admin-metrics">
        {metricas.map(([label, key]) => (
          <article className="admin-card admin-metric" key={key}>
            <span>{label}</span>
            <strong>{stats[key] ?? 0}</strong>
          </article>
        ))}
        <article className="admin-card admin-metric">
          <span>Duracion maxima</span>
          <strong>{formatoDuracionEvento(stats.duracionMaximaMs || 0)}</strong>
        </article>
        <article className="admin-card admin-metric">
          <span>Duracion promedio</span>
          <strong>{formatoDuracionEvento(stats.duracionPromedioMs || 0)}</strong>
        </article>
        <article className="admin-card admin-metric">
          <span>Kilometros</span>
          <strong>{formatoNumero(stats.kilometros || 0, 2)}</strong>
        </article>
        <article className="admin-card admin-metric">
          <span>Alertas/km</span>
          <strong>{formatoNumero(stats.alertasPorKm || 0, 2)}</strong>
        </article>
      </section>

      <article className="admin-card admin-recommendation">
        <span className="admin-label">Recomendacion</span>
        <p>{obtenerRecomendacion(indice)}</p>
      </article>

      <article className="admin-card">
        <div className="admin-table-header">
          <div>
            <span className="admin-label">Alertas recientes</span>
            <h2>Eventos del empleado</h2>
          </div>
          <strong>{latestAlerts.length}</strong>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Hora</th>
                <th>Evento</th>
                <th>Nivel</th>
                <th>Duracion</th>
                <th>Accion</th>
              </tr>
            </thead>
            <tbody>
              {latestAlerts.map((evento) => (
                <tr key={evento.id}>
                  <td>{evento.fechaHoraEvento || evento.fechaEventoISO || '--'}</td>
                  <td>{evento.tipoEvento}</td>
                  <td>{evento.nivel}</td>
                  <td>{formatoDuracionEvento(evento.duracionMs)}</td>
                  <td>{evento.accion || '--'}</td>
                </tr>
              ))}
              {latestAlerts.length === 0 && (
                <tr>
                  <td colSpan="5">Sin alertas registradas para este empleado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  )
}

export default AdminDriverPanel
