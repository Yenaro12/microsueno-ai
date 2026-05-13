import { formatoDuracionEvento, formatoNumero } from '../utils/formatters'

function EventsTable({ eventos }) {
  return (
    <section className="tarjeta tabla-eventos">
      <div className="titulo-tabla">
        <div>
          <h2>Eventos detectados</h2>
          <span>Marcadores de alerta visibles en el mapa</span>
        </div>
      </div>

      <div className="contenedor-tabla">
        <table>
          <thead>
            <tr>
              <th>Hora</th>
              <th>Tipo</th>
              <th>Nivel</th>
              <th>Delta</th>
              <th>Duracion</th>
              <th>Lat</th>
              <th>Lng</th>
              <th>Indice</th>
              <th>Accion</th>
            </tr>
          </thead>
          <tbody>
            {eventos.length === 0 ? (
              <tr>
                <td colSpan="9" className="sin-eventos">
                  Sin eventos registrados
                </td>
              </tr>
            ) : (
              eventos.map((evento) => (
                <tr key={evento.id}>
                  <td>{evento.fechaHoraEvento || evento.horaEvento}</td>
                  <td>{evento.tipoEvento}</td>
                  <td>
                    <span className={`chip-alerta ${evento.nivel}`}>{evento.nivel}</span>
                  </td>
                  <td>{formatoNumero(evento.desplazamiento, 0)} px</td>
                  <td>{formatoDuracionEvento(evento.duracionMs)}</td>
                  <td>{formatoNumero(evento.latitud, 5)}</td>
                  <td>{formatoNumero(evento.longitud, 5)}</td>
                  <td>{evento.indiceRiesgoActual}/100</td>
                  <td>{evento.accion}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default EventsTable
