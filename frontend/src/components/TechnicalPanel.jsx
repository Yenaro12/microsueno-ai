import AlarmControls from './AlarmControls'
import EventsTable from './EventsTable'
import MetricsPanel from './MetricsPanel'
import RiskStatus from './RiskStatus'
import TripAnalysis from './TripAnalysis'

function TechnicalPanel({
  mensajeSistema,
  deteccion,
  alarma,
  analisisViaje,
  eventos,
  limpiezaTemporal,
  onBack,
  onDetenerAlarma,
  onDescargarReporte,
}) {
  return (
    <main className="technical-screen">
      <header className="technical-header">
        <div>
          <span>Panel tecnico</span>
          <h1>Monitoreo y registros</h1>
        </div>
        <button type="button" onClick={onBack}>Volver al mapa</button>
      </header>

      <section className="technical-grid">
        <section className="tarjeta estado-sistema">
          <RiskStatus estadoRiesgo={deteccion.estadoRiesgo} alarmaActiva={alarma.alarmaActiva} />
          <p>{mensajeSistema}</p>
          <small>
            Limpiezas temporales: {limpiezaTemporal.limpiezasRealizadas}
            {limpiezaTemporal.ultimaLimpiezaTexto ? ` · ultima ${limpiezaTemporal.ultimaLimpiezaTexto}` : ''}
          </small>
          {deteccion.autocalibracionActiva && <small>Autocalibracion activa</small>}
        </section>

        <AlarmControls
          sonidoActivo={alarma.sonidoActivo}
          onAlternarSonido={alarma.alternarSonido}
          onDetenerAlarma={onDetenerAlarma}
        />
      </section>

      <MetricsPanel
        detectorListo={deteccion.detectorListo}
        tipoActual={deteccion.tipoActual}
        deltaY={deteccion.deltaY}
        desplazamientoAbsoluto={deteccion.desplazamientoAbsoluto}
        tiempoEventoActual={deteccion.tiempoEventoActual}
        posicionNarizY={deteccion.posicionNarizY}
      />

      <TripAnalysis analisisViaje={analisisViaje} />

      <div className="technical-actions">
        <button className="boton oscuro" type="button" onClick={onDescargarReporte} disabled={eventos.length === 0}>
          Descargar reporte CSV
        </button>
      </div>

      <EventsTable eventos={eventos} />
    </main>
  )
}

export default TechnicalPanel