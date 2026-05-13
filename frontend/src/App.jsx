import { useState } from 'react'
import AlarmControls from './components/AlarmControls'
import CameraMonitor from './components/CameraMonitor'
import EventsTable from './components/EventsTable'
import MapView from './components/MapView'
import MetricsPanel from './components/MetricsPanel'
import RiskStatus from './components/RiskStatus'
import TripAnalysis from './components/TripAnalysis'
import TripControls from './components/TripControls'
import { useAlarm } from './hooks/useAlarm'
import { useFaceDetection } from './hooks/useFaceDetection'
import { useGeolocation } from './hooks/useGeolocation'
import { useTripSession } from './hooks/useTripSession'
import { APP_NAME, TEXTS } from './utils/constants'
import { descargarReporteCSV } from './utils/csvExporter'
import { formatoNumero } from './utils/formatters'

function App() {
  const [mensajeSistema, setMensajeSistema] = useState('Inicia viaje para activar GPS y camara.')

  const alarma = useAlarm()
  const { setAudioRespaldoNode, audioRespaldoSrc } = alarma
  const geolocalizacion = useGeolocation({ onMessage: setMensajeSistema })
  const viaje = useTripSession({
    ubicacionActual: geolocalizacion.ubicacionActual,
    distanciaKm: geolocalizacion.distanciaKm,
    onMessage: setMensajeSistema,
  })
  const deteccion = useFaceDetection({
    registrarEvento: viaje.registrarEvento,
    actualizarEvento: viaje.actualizarEvento,
    controlarAlarma: alarma.controlarAlarma,
    detenerAlarma: alarma.detenerAlarma,
    resetBloqueoManual: alarma.resetBloqueoManual,
    desbloquearAudio: alarma.desbloquearAudio,
    onMessage: setMensajeSistema,
  })

  const analisisViaje = viaje.obtenerAnalisisViaje(deteccion.tiempoEventoActual)

  const iniciarViaje = async () => {
    await viaje.iniciarViaje({
      desbloquearAudio: alarma.desbloquearAudio,
      iniciarSeguimientoGps: geolocalizacion.iniciarSeguimientoGps,
      iniciarCamara: deteccion.iniciarCamara,
      resetRuta: geolocalizacion.resetRuta,
    })
  }

  const finalizarViaje = async () => {
    await viaje.finalizarViaje({
      detenerSeguimientoGps: geolocalizacion.detenerSeguimientoGps,
      detenerAlarma: alarma.detenerAlarma,
      finalizarEventoActual: deteccion.finalizarEventoActual,
      tiempoEventoActual: deteccion.tiempoEventoActual,
    })
  }

  const detenerAlarmaManual = () => {
    alarma.detenerAlarmaManual()
    deteccion.marcarAlarmaDetenidaManual()
    setMensajeSistema('Alarma detenida manualmente hasta volver a condicion normal.')
  }

  const descargarReporte = () => {
    descargarReporteCSV(viaje.eventosDetectados, viaje.idViaje)
  }

  return (
    <main className="aplicacion">
      <header className="barra-superior">
        <div>
          <p className="etiqueta">GPS inteligente para transporte</p>
          <h1>{APP_NAME}</h1>
        </div>
        <RiskStatus estadoRiesgo={deteccion.estadoRiesgo} alarmaActiva={alarma.alarmaActiva} />
      </header>

      <section className="tablero-viaje">
        <section className="tarjeta mapa-panel">
          <div className="titulo-panel">
            <div>
              <h2>Ruta en tiempo real</h2>
              <span>{viaje.viajeActivo ? 'Viaje activo' : 'Viaje detenido'}</span>
            </div>
            <strong>{formatoNumero(analisisViaje.kilometros, 2)} km</strong>
          </div>
          <MapView
            ubicacionActual={geolocalizacion.ubicacionActual}
            rutaRecorrida={geolocalizacion.rutaRecorrida}
            eventos={viaje.eventosDetectados}
            centrarMapaToken={geolocalizacion.centrarMapaToken}
          />
        </section>

        <section className="panel-operacion">
          <CameraMonitor
            videoRef={deteccion.videoRef}
            canvasRef={deteccion.canvasRef}
            camaraActiva={deteccion.camaraActiva}
            alarmaActiva={alarma.alarmaActiva}
            textoEncuadre={deteccion.textoEncuadre}
          />

          <TripControls
            viajeActivo={viaje.viajeActivo}
            camaraActiva={deteccion.camaraActiva}
            cargandoDetector={deteccion.cargandoDetector}
            hayEventos={viaje.eventosDetectados.length > 0}
            onIniciarViaje={iniciarViaje}
            onFinalizarViaje={finalizarViaje}
            onCentrarMapa={geolocalizacion.centrarMapa}
            onIniciarCamara={deteccion.iniciarCamara}
            onRecalibrar={deteccion.recalibrarManual}
            onDescargarReporte={descargarReporte}
          />

          <AlarmControls
            sonidoActivo={alarma.sonidoActivo}
            onAlternarSonido={alarma.alternarSonido}
            onDetenerAlarma={detenerAlarmaManual}
          />

          <section className="tarjeta estado-sistema">
            <p>{mensajeSistema}</p>
            <small>{TEXTS.PWA_ANDROID}</small>
            <small>{TEXTS.ENCUADRE}</small>
            {deteccion.autocalibracionActiva && <small>Autocalibracion activa</small>}
          </section>
        </section>
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
      <EventsTable eventos={viaje.eventosDetectados} />

      <audio ref={setAudioRespaldoNode} src={audioRespaldoSrc} preload="auto" />
    </main>
  )
}

export default App



