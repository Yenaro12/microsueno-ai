import { useEffect, useRef, useState } from 'react'
import DetectionService from '../../components/DetectionService'
import TechnicalPanel from '../../components/TechnicalPanel'
import UserProfile from '../../components/UserProfile'
import { useAlarm } from '../../hooks/useAlarm'
import { useConnectionStatus } from '../../hooks/useConnectionStatus'
import { useFaceDetection } from '../../hooks/useFaceDetection'
import { useGeolocation } from '../../hooks/useGeolocation'
import { useRoutePlanner } from '../../hooks/useRoutePlanner'
import { useTemporaryCacheCleanup } from '../../hooks/useTemporaryCacheCleanup'
import { useTripSession } from '../../hooks/useTripSession'
import { EVENT_TYPES, RISK_LEVELS } from '../../utils/constants'
import { descargarReporteCSV } from '../../utils/csvExporter'
import DriverMapScreen from './DriverMapScreen'

function AuthenticatedApp({ auth }) {
  const [mensajeSistema, setMensajeSistema] = useState('Listo para iniciar viaje. El boton Iniciar viaje activa camara, audio y GPS.')
  const [vista, setVista] = useState('mapa')
  const [rutaAbierta, setRutaAbierta] = useState(false)
  const ubicacionRegistradaRef = useRef(false)

  const alarma = useAlarm()
  const { setAudioRespaldoNode, audioRespaldoSrc } = alarma
  const geolocalizacion = useGeolocation({ onMessage: setMensajeSistema })
  const viaje = useTripSession({
    ubicacionActual: geolocalizacion.ubicacionActual,
    distanciaKm: geolocalizacion.distanciaKm,
    onMessage: setMensajeSistema,
    conductor: auth.usuario,
  })
  const conexion = useConnectionStatus({
    registrarEvento: viaje.registrarEvento,
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
  const ruta = useRoutePlanner({
    ubicacionActual: geolocalizacion.ubicacionActual,
    onMessage: setMensajeSistema,
  })
  const limpiezaTemporal = useTemporaryCacheCleanup({
    activo: deteccion.camaraActiva || viaje.viajeActivo,
    canvasRef: deteccion.canvasRef,
  })

  const analisisViaje = viaje.obtenerAnalisisViaje(deteccion.tiempoEventoActual)

  useEffect(() => {
    if (!viaje.viajeActivo) {
      ubicacionRegistradaRef.current = false
      return
    }

    if (geolocalizacion.ubicacionActual && !ubicacionRegistradaRef.current) {
      viaje.registrarEvento({
        tipoEvento: EVENT_TYPES.UBICACION_DETECTADA,
        nivel: RISK_LEVELS.BAJO,
        desplazamiento: 0,
        duracionMs: 0,
        accion: 'Ubicacion GPS detectada para el viaje',
      })
      ubicacionRegistradaRef.current = true
    }
  }, [geolocalizacion.ubicacionActual, viaje])

  const activarMonitoreoCamara = async () => {
    if (deteccion.camaraActiva) return true

    setMensajeSistema('Activando camara y monitoreo facial...')
    await alarma.desbloquearAudio()
    const camaraOk = await deteccion.iniciarCamara()

    if (!camaraOk) {
      setMensajeSistema('No se pudo activar la camara. Permite acceso a camara y usa localhost o HTTPS.')
      return false
    }

    setMensajeSistema('Camara activa. Monitoreo de microsueno en ejecucion.')
    return true
  }

  const iniciarViaje = async () => {
    if (viaje.viajeActivo) {
      await activarMonitoreoCamara()
      return
    }

    const camaraOk = await activarMonitoreoCamara()
    if (!camaraOk) return

    await viaje.iniciarViaje({
      desbloquearAudio: alarma.desbloquearAudio,
      iniciarSeguimientoGps: geolocalizacion.iniciarSeguimientoGps,
      iniciarCamara: async () => true,
      resetRuta: geolocalizacion.resetRuta,
    })
    viaje.registrarEvento({
      tipoEvento: EVENT_TYPES.INICIO_VIAJE,
      nivel: RISK_LEVELS.BAJO,
      desplazamiento: 0,
      duracionMs: 0,
      accion: 'Viaje iniciado por el conductor con monitoreo facial activo',
    })
    setMensajeSistema('Viaje iniciado. Monitoreo facial y GPS activos.')
  }

  const terminarViaje = async () => {
    viaje.registrarEvento({
      tipoEvento: EVENT_TYPES.FIN_VIAJE,
      nivel: RISK_LEVELS.BAJO,
      desplazamiento: 0,
      duracionMs: 0,
      accion: 'Viaje terminado por el conductor',
    })
    await viaje.finalizarViaje({
      detenerSeguimientoGps: geolocalizacion.detenerSeguimientoGps,
      detenerAlarma: alarma.detenerAlarma,
      finalizarEventoActual: deteccion.finalizarEventoActual,
      tiempoEventoActual: deteccion.tiempoEventoActual,
    })
  }

  const activarPanico = async () => {
    await alarma.emitirAlertaEmergencia()
    viaje.registrarEvento({
      tipoEvento: EVENT_TYPES.PANICO,
      nivel: RISK_LEVELS.ALARMA,
      desplazamiento: 0,
      duracionMs: 0,
      accion: 'Alerta critica activada desde boton de panico',
    })
    setMensajeSistema('Boton de panico activado. Evento critico registrado.')
  }

  const detenerAlarmaManual = () => {
    alarma.detenerAlarmaManual()
    deteccion.marcarAlarmaDetenidaManual()
    setMensajeSistema('Alarma detenida manualmente hasta volver a condicion normal.')
  }

  const descargarReporte = () => {
    descargarReporteCSV(viaje.eventosDetectados, viaje.idViaje)
  }

  const volverAlMapa = () => setVista('mapa')

  let vistaActual
  if (vista === 'perfil') {
    vistaActual = (
      <UserProfile
        usuario={auth.usuario}
        onBack={volverAlMapa}
        onOpenTechnical={() => setVista('tecnico')}
        onLogout={auth.cerrarSesion}
      />
    )
  } else if (vista === 'tecnico') {
    vistaActual = (
      <TechnicalPanel
        mensajeSistema={mensajeSistema}
        deteccion={deteccion}
        alarma={alarma}
        analisisViaje={analisisViaje}
        eventos={viaje.eventosDetectados}
        limpiezaTemporal={limpiezaTemporal}
        onBack={volverAlMapa}
        onDetenerAlarma={detenerAlarmaManual}
        onDescargarReporte={descargarReporte}
      />
    )
  } else {
    vistaActual = (
      <DriverMapScreen
        conexion={conexion}
        geolocalizacion={geolocalizacion}
        ruta={ruta}
        usuario={auth.usuario}
        mensajeSistema={mensajeSistema}
        deteccion={deteccion}
        viaje={viaje}
        rutaAbierta={rutaAbierta}
        onAbrirRuta={() => setRutaAbierta(true)}
        onCerrarRuta={() => setRutaAbierta(false)}
        onAbrirPerfil={() => setVista('perfil')}
        onIniciarViaje={iniciarViaje}
        onTerminarViaje={terminarViaje}
        onPanic={activarPanico}
      />
    )
  }

  return (
    <>
      <DetectionService
        videoRef={deteccion.videoRef}
        canvasRef={deteccion.canvasRef}
        visible={vista === 'mapa'}
        camaraActiva={deteccion.camaraActiva}
        estadoRiesgo={deteccion.estadoRiesgo}
        tipoActual={deteccion.tipoActual}
        puntajeRiesgo={deteccion.puntajeRiesgo}
        calibrandoReferencia={deteccion.calibrandoReferencia}
      />
      {vistaActual}
      <audio ref={setAudioRespaldoNode} src={audioRespaldoSrc} preload="auto" />
    </>
  )
}

export default AuthenticatedApp
