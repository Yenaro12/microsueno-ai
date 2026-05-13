import RoutePlanner from './RoutePlanner'

function RouteModal({ ruta, onClose }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="route-modal" role="dialog" aria-modal="true" aria-label="Configurar ruta">
        <header className="modal-header">
          <div>
            <span>Ruta de transporte</span>
            <h2>Origen y destino</h2>
          </div>
          <button type="button" onClick={onClose}>Cerrar</button>
        </header>

        <RoutePlanner
          origenTexto={ruta.origenTexto}
          destinoTexto={ruta.destinoTexto}
          estadoRuta={ruta.estadoRuta}
          mensajeRuta={ruta.mensajeRuta}
          resumenRuta={ruta.resumenRuta}
          origenSugerido={ruta.origenSugerido}
          onOrigenChange={ruta.setOrigenTexto}
          onDestinoChange={ruta.setDestinoTexto}
          onUsarUbicacionActual={ruta.usarUbicacionActualComoOrigen}
          onCalcularRuta={ruta.calcularRuta}
          onLimpiarRuta={ruta.limpiarRuta}
        />
      </section>
    </div>
  )
}

export default RouteModal