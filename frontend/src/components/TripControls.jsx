function TripControls({
  viajeActivo,
  camaraActiva,
  cargandoDetector,
  hayEventos,
  onIniciarViaje,
  onFinalizarViaje,
  onCentrarMapa,
  onIniciarCamara,
  onRecalibrar,
  onDescargarReporte,
}) {
  return (
    <section className="acciones acciones-viaje">
      <button className="boton primario" type="button" onClick={onIniciarViaje} disabled={viajeActivo}>
        Iniciar viaje
      </button>
      <button className="boton peligro" type="button" onClick={onFinalizarViaje} disabled={!viajeActivo}>
        Finalizar viaje
      </button>
      <button className="boton secundario" type="button" onClick={onCentrarMapa}>
        Centrar mapa
      </button>
      <button className="boton secundario" type="button" onClick={onIniciarCamara} disabled={camaraActiva || cargandoDetector}>
        {cargandoDetector ? 'Cargando...' : 'Iniciar camara'}
      </button>
      <button className="boton secundario" type="button" onClick={onRecalibrar} disabled={!camaraActiva}>
        Recalibrar
      </button>
      <button className="boton oscuro" type="button" onClick={onDescargarReporte} disabled={!hayEventos}>
        Descargar reporte CSV
      </button>
    </section>
  )
}

export default TripControls
