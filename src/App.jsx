import { useEffect, useMemo, useRef, useState } from 'react'
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'
import RouteMap from './RouteMap.jsx'
import './App.css'

const NOMBRE_APP = 'MicroSue\u00f1o TEC'
const INDICE_PUNTO_NARIZ = 1
const UMBRAL_DESPLAZAMIENTO_PX = 45
const UMBRAL_RETORNO_NORMAL_PX = UMBRAL_DESPLAZAMIENTO_PX * 0.55
const TIEMPO_RIESGO_MEDIO_MS = 2000
const TIEMPO_RIESGO_ALTO_MS = 2000
const TIEMPO_ALARMA_FUERTE_MS = 3000
const INTERVALO_BEEP_ALARMA_MS = 330
const CLAVE_EVENTOS = 'microsueno_eventos_viaje_v1'
const URL_MODELO_CARA =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task'
const URL_WASM_MEDIAPIPE =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'

const textoEncuadre = 'Mant\u00e9n tu rostro dentro del encuadre'

const formatoNumero = (valor, decimales = 1) =>
  Number.isFinite(valor) ? valor.toFixed(decimales) : '--'

const formatoTiempo = (milisegundos) => {
  const totalSegundos = Math.max(0, Math.floor((milisegundos || 0) / 1000))
  const minutos = Math.floor(totalSegundos / 60)
  const segundos = totalSegundos % 60
  return `${minutos}:${String(segundos).padStart(2, '0')}`
}

const formatoDuracionEvento = (milisegundos) => `${((milisegundos || 0) / 1000).toFixed(1)} s`

const crearId = (prefijo = 'id') => `${prefijo}-${Date.now()}-${Math.random().toString(16).slice(2)}`

const escaparCSV = (valor) => `"${String(valor ?? '').replaceAll('"', '""')}"`

const leerEventosGuardados = () => {
  try {
    const guardado = localStorage.getItem(CLAVE_EVENTOS)
    return guardado ? JSON.parse(guardado) : []
  } catch {
    return []
  }
}

const calcularDistanciaMetros = (origen, destino) => {
  if (!origen || !destino) return 0
  const radioTierra = 6371000
  const lat1 = (origen.latitud * Math.PI) / 180
  const lat2 = (destino.latitud * Math.PI) / 180
  const deltaLat = ((destino.latitud - origen.latitud) * Math.PI) / 180
  const deltaLng = ((destino.longitud - origen.longitud) * Math.PI) / 180
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2
  return radioTierra * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function App() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const audioRespaldoRef = useRef(null)
  const detectorRef = useRef(null)
  const flujoCamaraRef = useRef(null)
  const animacionRef = useRef(null)
  const audioContextoRef = useRef(null)
  const gananciaAlarmaRef = useRef(null)
  const osciladoresAlarmaRef = useRef([])
  const posicionNarizActualRef = useRef(null)
  const referenciaNarizRef = useRef(null)
  const inicioEventoRef = useRef(null)
  const eventoActualIdRef = useRef(null)
  const tipoEventoActualRef = useRef(null)
  const ultimoBeepRef = useRef(0)
  const estadoRiesgoRef = useRef('bajo')
  const sonidoActivoRef = useRef(true)
  const alarmaDetenidaManualRef = useRef(false)
  const alarmaActivaRef = useRef(false)
  const watchGpsRef = useRef(null)
  const ubicacionActualRef = useRef(null)
  const idViajeRef = useRef('')
  const horaInicioViajeRef = useRef('')

  const [camaraActiva, setCamaraActiva] = useState(false)
  const [detectorListo, setDetectorListo] = useState(false)
  const [cargandoDetector, setCargandoDetector] = useState(false)
  const [viajeActivo, setViajeActivo] = useState(false)
  const [idViaje, setIdViaje] = useState('')
  const [horaInicioViaje, setHoraInicioViaje] = useState('')
  const [horaFinViaje, setHoraFinViaje] = useState('')
  const [relojViaje, setRelojViaje] = useState(Date.now())
  const [sonidoActivo, setSonidoActivo] = useState(true)
  const [alarmaActiva, setAlarmaActiva] = useState(false)
  const [autocalibracionActiva, setAutocalibracionActiva] = useState(false)
  const [mensajeSistema, setMensajeSistema] = useState('Inicia viaje para activar GPS y camara.')
  const [estadoRiesgo, setEstadoRiesgo] = useState('bajo')
  const [tipoActual, setTipoActual] = useState('Listo')
  const [posicionNarizY, setPosicionNarizY] = useState(null)
  const [referenciaNarizY, setReferenciaNarizY] = useState(null)
  const [deltaY, setDeltaY] = useState(0)
  const [desplazamientoAbsoluto, setDesplazamientoAbsoluto] = useState(0)
  const [tiempoEventoActual, setTiempoEventoActual] = useState(0)
  const [ubicacionActual, setUbicacionActual] = useState(null)
  const [rutaRecorrida, setRutaRecorrida] = useState([])
  const [centrarMapaToken, setCentrarMapaToken] = useState(0)
  const [eventosDetectados, setEventosDetectados] = useState(leerEventosGuardados)

  useEffect(() => {
    sonidoActivoRef.current = sonidoActivo
    if (!sonidoActivo) detenerAlarma()
  }, [sonidoActivo])

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE_EVENTOS, JSON.stringify(eventosDetectados))
    } catch {
      setMensajeSistema('No se pudo guardar el historial local.')
    }
  }, [eventosDetectados])

  useEffect(() => {
    if (!viajeActivo) return undefined
    const intervalo = setInterval(() => setRelojViaje(Date.now()), 1000)
    return () => clearInterval(intervalo)
  }, [viajeActivo])

  useEffect(() => {
    return () => {
      detenerCamara()
      detenerSeguimientoGps()
      detenerAlarma()
      detectorRef.current?.close()
    }
  }, [])

  const calcularIndiceRiesgo = (eventos = eventosDetectados) => {
    const puntosEventos = eventos.reduce((total, evento) => {
      let puntos = total
      if (evento.nivel === 'medio') puntos += 5
      if (evento.nivel === 'alto') puntos += 10
      if (evento.nivel === 'alarma') puntos += 20
      if (evento.tipoEvento === 'Rostro perdido') puntos += 15
      if (evento.tipoEvento === 'Nariz no detectada') puntos += 15
      return puntos
    }, 0)
    const duracionMaxima = eventos.reduce(
      (maximo, evento) => Math.max(maximo, evento.duracionMs || 0),
      0,
    )
    const puntosDuracion = duracionMaxima > 5000 ? 15 : 0
    const puntosAlertas = eventos.length > 3 ? 15 : 0
    return Math.min(100, puntosEventos + puntosDuracion + puntosAlertas)
  }

  const analisisViaje = useMemo(() => {
    const inicio = horaInicioViaje ? new Date(horaInicioViaje).getTime() : null
    const fin = horaFinViaje ? new Date(horaFinViaje).getTime() : relojViaje
    const duracionViajeMs = inicio ? Math.max(0, fin - inicio) : 0
    const totalEventos = eventosDetectados.length
    const eventosCabezaAbajo = eventosDetectados.filter(
      (evento) => evento.tipoEvento === 'Cabeza abajo',
    ).length
    const eventosCabezaArriba = eventosDetectados.filter(
      (evento) => evento.tipoEvento === 'Cabeza arriba',
    ).length
    const eventosRostroPerdido = eventosDetectados.filter(
      (evento) => evento.tipoEvento === 'Rostro perdido',
    ).length
    const eventosNarizNoDetectada = eventosDetectados.filter(
      (evento) => evento.tipoEvento === 'Nariz no detectada',
    ).length
    const duracionTotal = eventosDetectados.reduce(
      (total, evento) => total + (evento.duracionMs || 0),
      0,
    )
    const duracionMaxima = Math.max(
      tiempoEventoActual,
      eventosDetectados.reduce((maximo, evento) => Math.max(maximo, evento.duracionMs || 0), 0),
    )
    const duracionPromedio = totalEventos ? duracionTotal / totalEventos : 0
    const distanciaMetros = rutaRecorrida.reduce(
      (total, punto, indice) =>
        indice === 0 ? 0 : total + calcularDistanciaMetros(rutaRecorrida[indice - 1], punto),
      0,
    )
    const kilometros = distanciaMetros / 1000
    const alertasPorKm = kilometros > 0 ? totalEventos / kilometros : 0
    const indiceRiesgo = calcularIndiceRiesgo(eventosDetectados)
    const clasificacion =
      indiceRiesgo <= 30 ? 'Riesgo bajo' : indiceRiesgo <= 60 ? 'Riesgo medio' : 'Riesgo alto'
    const recomendacion =
      indiceRiesgo <= 30
        ? 'Viaje estable, sin patrones criticos detectados.'
        : indiceRiesgo <= 60
          ? 'Se detectaron senales moderadas de fatiga. Se recomienda precaucion.'
          : 'Se detectaron patrones criticos. Se recomienda detenerse en un lugar seguro y descansar.'

    return {
      duracionViajeMs,
      totalEventos,
      eventosCabezaAbajo,
      eventosCabezaArriba,
      eventosRostroPerdido,
      eventosNarizNoDetectada,
      duracionMaxima,
      duracionPromedio,
      kilometros,
      alertasPorKm,
      indiceRiesgo,
      clasificacion,
      recomendacion,
    }
  }, [eventosDetectados, horaFinViaje, horaInicioViaje, relojViaje, rutaRecorrida, tiempoEventoActual])

  const desbloquearAudio = async () => {
    const ConstructorAudio = window.AudioContext || window.webkitAudioContext
    try {
      if (ConstructorAudio && !audioContextoRef.current) {
        audioContextoRef.current = new ConstructorAudio()
      }
      if (audioContextoRef.current?.state === 'suspended') {
        await audioContextoRef.current.resume()
      }
      const contexto = audioContextoRef.current
      if (contexto) {
        const oscilador = contexto.createOscillator()
        const ganancia = contexto.createGain()
        ganancia.gain.setValueAtTime(0.0001, contexto.currentTime)
        oscilador.connect(ganancia)
        ganancia.connect(contexto.destination)
        oscilador.start()
        oscilador.stop(contexto.currentTime + 0.03)
      }
    } catch {
      setMensajeSistema('AudioContext no disponible. Se usara respaldo de audio si el navegador lo permite.')
    }

    try {
      const audio = audioRespaldoRef.current
      if (audio) {
        audio.volume = 0.8
        await audio.play()
        audio.pause()
        audio.currentTime = 0
      }
    } catch {
      // Algunos navegadores no permiten probar el respaldo hasta que exista una alarma real.
    }
  }

  const crearAudioRespaldo = () => {
    const frecuenciaMuestreo = 8000
    const duracion = 0.22
    const muestras = Math.floor(frecuenciaMuestreo * duracion)
    const buffer = new ArrayBuffer(44 + muestras * 2)
    const vista = new DataView(buffer)
    const escribir = (offset, texto) => {
      for (let i = 0; i < texto.length; i += 1) vista.setUint8(offset + i, texto.charCodeAt(i))
    }
    escribir(0, 'RIFF')
    vista.setUint32(4, 36 + muestras * 2, true)
    escribir(8, 'WAVE')
    escribir(12, 'fmt ')
    vista.setUint32(16, 16, true)
    vista.setUint16(20, 1, true)
    vista.setUint16(22, 1, true)
    vista.setUint32(24, frecuenciaMuestreo, true)
    vista.setUint32(28, frecuenciaMuestreo * 2, true)
    vista.setUint16(32, 2, true)
    vista.setUint16(34, 16, true)
    escribir(36, 'data')
    vista.setUint32(40, muestras * 2, true)
    for (let i = 0; i < muestras; i += 1) {
      const muestra = Math.sin((2 * Math.PI * 1100 * i) / frecuenciaMuestreo)
      vista.setInt16(44 + i * 2, muestra * 28000, true)
    }
    const bytes = new Uint8Array(buffer)
    let binario = ''
    bytes.forEach((byte) => {
      binario += String.fromCharCode(byte)
    })
    return `data:audio/wav;base64,${btoa(binario)}`
  }

  const emitirBeepRespaldo = async () => {
    try {
      const audio = audioRespaldoRef.current
      if (!audio) return
      audio.currentTime = 0
      audio.volume = 1
      await audio.play()
    } catch {
      // Sin salida de respaldo disponible.
    }
  }

  const emitirBeepAlarma = async () => {
    if (!sonidoActivoRef.current || alarmaDetenidaManualRef.current) return
    try {
      const contexto = audioContextoRef.current
      if (!contexto) throw new Error('Sin AudioContext')
      if (contexto.state === 'suspended') await contexto.resume()

      const ahora = contexto.currentTime
      const oscilador = contexto.createOscillator()
      const osciladorExtra = contexto.createOscillator()
      const ganancia = contexto.createGain()

      oscilador.type = 'square'
      osciladorExtra.type = 'sawtooth'
      oscilador.frequency.setValueAtTime(1120, ahora)
      oscilador.frequency.setValueAtTime(820, ahora + 0.18)
      osciladorExtra.frequency.setValueAtTime(1640, ahora)
      ganancia.gain.setValueAtTime(0.001, ahora)
      ganancia.gain.exponentialRampToValueAtTime(0.9, ahora + 0.025)
      ganancia.gain.exponentialRampToValueAtTime(0.001, ahora + 0.24)
      oscilador.connect(ganancia)
      osciladorExtra.connect(ganancia)
      ganancia.connect(contexto.destination)
      oscilador.start(ahora)
      osciladorExtra.start(ahora)
      oscilador.stop(ahora + 0.25)
      osciladorExtra.stop(ahora + 0.25)
    } catch {
      emitirBeepRespaldo()
    }

    if ('vibrate' in navigator) {
      navigator.vibrate([500, 200, 500, 200, 1000])
    }
  }

  const iniciarAlarmaContinua = () => {
    if (!sonidoActivoRef.current || alarmaDetenidaManualRef.current) return
    alarmaActivaRef.current = true
    setAlarmaActiva(true)
  }

  const detenerAlarma = () => {
    ultimoBeepRef.current = 0
    alarmaActivaRef.current = false
    setAlarmaActiva(false)
    osciladoresAlarmaRef.current.forEach((oscilador) => {
      try {
        oscilador.stop()
      } catch {
        // El oscilador ya pudo detenerse.
      }
    })
    osciladoresAlarmaRef.current = []
    if (gananciaAlarmaRef.current) {
      try {
        gananciaAlarmaRef.current.disconnect()
      } catch {
        // Nada que desconectar.
      }
      gananciaAlarmaRef.current = null
    }
    if ('vibrate' in navigator) navigator.vibrate(0)
  }

  const controlarAlarma = (debeSonar, ahora) => {
    if (!debeSonar || alarmaDetenidaManualRef.current || !sonidoActivoRef.current) {
      detenerAlarma()
      return
    }

    iniciarAlarmaContinua()
    if (ahora - ultimoBeepRef.current >= INTERVALO_BEEP_ALARMA_MS) {
      emitirBeepAlarma()
      ultimoBeepRef.current = ahora
    }
  }

  const prepararDetector = async () => {
    if (detectorRef.current) return detectorRef.current
    setCargandoDetector(true)
    setMensajeSistema('Cargando modelo de MediaPipe...')

    const vision = await FilesetResolver.forVisionTasks(URL_WASM_MEDIAPIPE)
    const crearDetector = (delegate) =>
      FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: URL_MODELO_CARA,
          delegate,
        },
        runningMode: 'VIDEO',
        numFaces: 1,
      })

    let detector
    try {
      detector = await crearDetector('GPU')
    } catch {
      detector = await crearDetector('CPU')
    }

    detectorRef.current = detector
    setDetectorListo(true)
    setCargandoDetector(false)
    return detector
  }

  const sincronizarCanvas = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth || 960
    canvas.height = video.videoHeight || 540
  }

  const iniciarCamara = async () => {
    try {
      await desbloquearAudio()
      const detector = await prepararDetector()
      const flujo = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 960 },
          height: { ideal: 540 },
        },
        audio: false,
      })

      flujoCamaraRef.current = flujo
      videoRef.current.srcObject = flujo
      await videoRef.current.play()
      sincronizarCanvas()
      setCamaraActiva(true)
      setMensajeSistema('Camara activa. Mantente dentro del encuadre.')
      detectarEnVideo(detector)
      return true
    } catch (error) {
      setCargandoDetector(false)
      setMensajeSistema('No se pudo iniciar la camara. Revisa permisos o usa localhost/HTTPS.')
      console.error(error)
      return false
    }
  }

  const detenerCamara = () => {
    if (animacionRef.current) {
      cancelAnimationFrame(animacionRef.current)
      animacionRef.current = null
    }
    flujoCamaraRef.current?.getTracks().forEach((track) => track.stop())
    flujoCamaraRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCamaraActiva(false)
  }

  const iniciarSeguimientoGps = () => {
    if (!navigator.geolocation) {
      setMensajeSistema('Este navegador no soporta geolocalizacion.')
      return
    }
    if (watchGpsRef.current) return

    watchGpsRef.current = navigator.geolocation.watchPosition(
      (posicion) => {
        const punto = {
          latitud: posicion.coords.latitude,
          longitud: posicion.coords.longitude,
          precision: posicion.coords.accuracy,
          timestamp: posicion.timestamp,
        }
        ubicacionActualRef.current = punto
        setUbicacionActual(punto)
        setRutaRecorrida((ruta) => {
          const ultimo = ruta[ruta.length - 1]
          if (ultimo && calcularDistanciaMetros(ultimo, punto) < 4) return ruta
          return [...ruta, punto]
        })
      },
      () => {
        setMensajeSistema('No se pudo obtener GPS. Revisa permisos de ubicacion.')
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000,
      },
    )
  }

  const detenerSeguimientoGps = () => {
    if (watchGpsRef.current) {
      navigator.geolocation.clearWatch(watchGpsRef.current)
      watchGpsRef.current = null
    }
  }

  const reiniciarViaje = (fechaInicio) => {
    const nuevoId = crearId('viaje')
    idViajeRef.current = nuevoId
    horaInicioViajeRef.current = fechaInicio.toISOString()
    setIdViaje(nuevoId)
    setHoraInicioViaje(fechaInicio.toISOString())
    setHoraFinViaje('')
    setEventosDetectados([])
    setRutaRecorrida([])
    setTiempoEventoActual(0)
    setDeltaY(0)
    setDesplazamientoAbsoluto(0)
    setTipoActual('Monitoreando')
    inicioEventoRef.current = null
    eventoActualIdRef.current = null
    tipoEventoActualRef.current = null
  }

  const iniciarViaje = async () => {
    if (viajeActivo) return
    const fechaInicio = new Date()
    await desbloquearAudio()
    reiniciarViaje(fechaInicio)
    setViajeActivo(true)
    iniciarSeguimientoGps()
    if (!camaraActiva) await iniciarCamara()
    setMensajeSistema('Viaje activo. GPS y analisis facial en ejecucion.')
  }

  const finalizarViaje = () => {
    if (!viajeActivo) return
    setHoraFinViaje(new Date().toISOString())
    setViajeActivo(false)
    detenerSeguimientoGps()
    finalizarEventoActual(performance.now())
    detenerAlarma()
    actualizarRiesgo('bajo')
    setMensajeSistema('Viaje finalizado. Reporte listo para exportar.')
  }

  const recalibrarManual = () => {
    const posicionActual = posicionNarizActualRef.current
    if (!posicionActual) {
      setMensajeSistema('Aun no detecto la nariz. Mantente de frente a la camara.')
      return
    }
    referenciaNarizRef.current = posicionActual.y
    setReferenciaNarizY(posicionActual.y)
    setDeltaY(0)
    setDesplazamientoAbsoluto(0)
    setTiempoEventoActual(0)
    setTipoActual('Referencia calibrada')
    alarmaDetenidaManualRef.current = false
    detenerAlarma()
  }

  const actualizarReferenciaSuave = (posicionY) => {
    const referencia = referenciaNarizRef.current
    if (!Number.isFinite(referencia) || estadoRiesgoRef.current !== 'bajo' || alarmaActivaRef.current) {
      setAutocalibracionActiva(false)
      return
    }
    const nuevaReferencia = referencia * 0.98 + posicionY * 0.02
    referenciaNarizRef.current = nuevaReferencia
    setReferenciaNarizY(nuevaReferencia)
    setAutocalibracionActiva(true)
  }

  const actualizarRiesgo = (riesgo) => {
    estadoRiesgoRef.current = riesgo
    setEstadoRiesgo(riesgo)
  }

  const agregarEvento = (evento) => {
    setEventosDetectados((eventos) => [evento, ...eventos].slice(0, 200))
  }

  const actualizarEventoActual = (datos) => {
    const idEvento = eventoActualIdRef.current
    if (!idEvento) return
    setEventosDetectados((eventos) =>
      eventos.map((evento) => {
        if (evento.id !== idEvento) return evento
        const actualizado = { ...evento, ...datos }
        return {
          ...actualizado,
          indiceRiesgoActual: calcularIndiceRiesgo([
            actualizado,
            ...eventos.filter((item) => item.id !== idEvento),
          ]),
        }
      }),
    )
  }

  const registrarEventoSiHaceFalta = (nivel, tipoEvento, desplazamiento, duracionMs, accion) => {
    if (eventoActualIdRef.current) {
      actualizarEventoActual({ nivel, tipoEvento, desplazamiento, duracionMs, accion })
      return
    }

    const fecha = new Date()
    const ubicacion = ubicacionActualRef.current
    const eventoBase = {
      id: crearId('evento'),
      idViaje: idViajeRef.current || idViaje || 'sin-viaje',
      horaInicioViaje: horaInicioViajeRef.current || horaInicioViaje,
      horaEvento: fecha.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      fechaEventoISO: fecha.toISOString(),
      tipoEvento,
      nivel,
      desplazamiento,
      duracionMs,
      latitud: ubicacion?.latitud ?? null,
      longitud: ubicacion?.longitud ?? null,
      accion,
    }
    eventoBase.indiceRiesgoActual = calcularIndiceRiesgo([eventoBase, ...eventosDetectados])
    eventoActualIdRef.current = eventoBase.id
    agregarEvento(eventoBase)
  }

  const finalizarEventoActual = (ahora) => {
    if (inicioEventoRef.current && eventoActualIdRef.current) {
      actualizarEventoActual({ duracionMs: ahora - inicioEventoRef.current })
    }
    inicioEventoRef.current = null
    eventoActualIdRef.current = null
    tipoEventoActualRef.current = null
    alarmaDetenidaManualRef.current = false
    setTiempoEventoActual(0)
    setTipoActual('Normal')
    detenerAlarma()
  }

  const iniciarOContinuarEvento = (tipoEvento, ahora) => {
    if (!inicioEventoRef.current || tipoEventoActualRef.current !== tipoEvento) {
      finalizarEventoActual(ahora)
      inicioEventoRef.current = ahora
      tipoEventoActualRef.current = tipoEvento
      alarmaDetenidaManualRef.current = false
    }
    return ahora - inicioEventoRef.current
  }

  const evaluarPerdidaDeteccion = (tipoEvento, ahora) => {
    setAutocalibracionActiva(false)
    setTipoActual(tipoEvento)
    setDeltaY(0)
    setDesplazamientoAbsoluto(0)
    const duracion = iniciarOContinuarEvento(tipoEvento, ahora)
    setTiempoEventoActual(duracion)

    if (duracion >= TIEMPO_ALARMA_FUERTE_MS) {
      actualizarRiesgo('alto')
      registrarEventoSiHaceFalta(
        'alarma',
        tipoEvento,
        0,
        duracion,
        tipoEvento === 'Rostro perdido'
          ? 'Alarma por rostro perdido'
          : 'Alarma por nariz no detectada',
      )
      controlarAlarma(true, ahora)
      return
    }

    if (duracion >= TIEMPO_RIESGO_MEDIO_MS) {
      actualizarRiesgo('medio')
      registrarEventoSiHaceFalta(
        'medio',
        tipoEvento,
        0,
        duracion,
        tipoEvento === 'Rostro perdido'
          ? 'Rostro no detectado por mas de 2 s'
          : 'Nariz no detectada por mas de 2 s',
      )
    } else {
      actualizarRiesgo('bajo')
    }
    controlarAlarma(false, ahora)
  }

  const evaluarMovimientoCabeza = (posicionY, ahora) => {
    const referencia = referenciaNarizRef.current
    if (!Number.isFinite(referencia)) {
      referenciaNarizRef.current = posicionY
      setReferenciaNarizY(posicionY)
      actualizarRiesgo('bajo')
      setTipoActual('Referencia inicial')
      return
    }

    const nuevoDeltaY = posicionY - referencia
    const absoluto = Math.abs(nuevoDeltaY)
    const tipoEvento = nuevoDeltaY >= 0 ? 'Cabeza abajo' : 'Cabeza arriba'

    setDeltaY(nuevoDeltaY)
    setDesplazamientoAbsoluto(absoluto)

    if (absoluto <= UMBRAL_RETORNO_NORMAL_PX) {
      finalizarEventoActual(ahora)
      actualizarRiesgo('bajo')
      actualizarReferenciaSuave(posicionY)
      return
    }

    if (absoluto <= UMBRAL_DESPLAZAMIENTO_PX) {
      finalizarEventoActual(ahora)
      actualizarRiesgo('bajo')
      actualizarReferenciaSuave(posicionY)
      return
    }

    setAutocalibracionActiva(false)
    setTipoActual(tipoEvento)
    const duracion = iniciarOContinuarEvento(tipoEvento, ahora)
    setTiempoEventoActual(duracion)

    if (duracion >= TIEMPO_ALARMA_FUERTE_MS) {
      actualizarRiesgo('alto')
      registrarEventoSiHaceFalta(
        'alarma',
        tipoEvento,
        nuevoDeltaY,
        duracion,
        tipoEvento === 'Cabeza abajo'
          ? 'Alarma fuerte por cabeza abajo'
          : 'Alarma fuerte por cabeza arriba',
      )
      controlarAlarma(true, ahora)
      return
    }

    if (duracion >= TIEMPO_RIESGO_ALTO_MS) {
      actualizarRiesgo('alto')
      registrarEventoSiHaceFalta(
        'alto',
        tipoEvento,
        nuevoDeltaY,
        duracion,
        tipoEvento === 'Cabeza abajo'
          ? 'Riesgo alto por cabeza abajo'
          : 'Riesgo alto por cabeza arriba',
      )
      controlarAlarma(true, ahora)
      return
    }

    actualizarRiesgo('bajo')
    controlarAlarma(false, ahora)
  }

  const limpiarCanvas = () => {
    const canvas = canvasRef.current
    const contexto = canvas?.getContext('2d')
    if (canvas && contexto) contexto.clearRect(0, 0, canvas.width, canvas.height)
  }

  const dibujarNariz = (puntoNariz) => {
    const canvas = canvasRef.current
    const contexto = canvas?.getContext('2d')
    if (!canvas || !contexto) return

    contexto.clearRect(0, 0, canvas.width, canvas.height)
    const referencia = referenciaNarizRef.current
    if (Number.isFinite(referencia)) {
      contexto.setLineDash([12, 10])
      contexto.strokeStyle = 'rgba(34, 197, 94, 0.9)'
      contexto.lineWidth = 4
      contexto.beginPath()
      contexto.moveTo(0, referencia)
      contexto.lineTo(canvas.width, referencia)
      contexto.stroke()
      contexto.setLineDash([])

      contexto.strokeStyle = 'rgba(245, 158, 11, 0.48)'
      contexto.lineWidth = 2
      contexto.beginPath()
      contexto.moveTo(0, referencia + UMBRAL_DESPLAZAMIENTO_PX)
      contexto.lineTo(canvas.width, referencia + UMBRAL_DESPLAZAMIENTO_PX)
      contexto.moveTo(0, referencia - UMBRAL_DESPLAZAMIENTO_PX)
      contexto.lineTo(canvas.width, referencia - UMBRAL_DESPLAZAMIENTO_PX)
      contexto.stroke()
    }

    contexto.fillStyle =
      estadoRiesgoRef.current === 'alto'
        ? '#ef4444'
        : estadoRiesgoRef.current === 'medio'
          ? '#f59e0b'
          : '#22c55e'
    contexto.strokeStyle = 'rgba(255, 255, 255, 0.95)'
    contexto.lineWidth = 5
    contexto.beginPath()
    contexto.arc(puntoNariz.x, puntoNariz.y, 13, 0, Math.PI * 2)
    contexto.fill()
    contexto.stroke()
  }

  const detectarEnVideo = (detector) => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    if (video.readyState < 2) {
      animacionRef.current = requestAnimationFrame(() => detectarEnVideo(detector))
      return
    }

    sincronizarCanvas()
    const ahora = performance.now()
    const resultado = detector.detectForVideo(video, ahora)
    const landmarksCara = resultado.faceLandmarks?.[0]

    if (!landmarksCara) {
      posicionNarizActualRef.current = null
      limpiarCanvas()
      evaluarPerdidaDeteccion('Rostro perdido', ahora)
      animacionRef.current = requestAnimationFrame(() => detectarEnVideo(detector))
      return
    }

    const puntoNariz = landmarksCara[INDICE_PUNTO_NARIZ]
    if (!puntoNariz || !Number.isFinite(puntoNariz.x) || !Number.isFinite(puntoNariz.y)) {
      limpiarCanvas()
      evaluarPerdidaDeteccion('Nariz no detectada', ahora)
      animacionRef.current = requestAnimationFrame(() => detectarEnVideo(detector))
      return
    }

    const posicionNariz = {
      x: puntoNariz.x * canvas.width,
      y: puntoNariz.y * canvas.height,
    }

    posicionNarizActualRef.current = posicionNariz
    setPosicionNarizY(posicionNariz.y)
    evaluarMovimientoCabeza(posicionNariz.y, ahora)
    dibujarNariz(posicionNariz)
    animacionRef.current = requestAnimationFrame(() => detectarEnVideo(detector))
  }

  const alternarSonido = () => {
    setSonidoActivo((activo) => {
      const nuevoEstado = !activo
      if (!nuevoEstado) {
        alarmaDetenidaManualRef.current = true
        detenerAlarma()
      } else {
        alarmaDetenidaManualRef.current = false
        desbloquearAudio()
      }
      return nuevoEstado
    })
  }

  const detenerAlarmaManual = () => {
    alarmaDetenidaManualRef.current = true
    detenerAlarma()
    actualizarEventoActual({ accion: 'Alarma detenida manualmente' })
    setMensajeSistema('Alarma detenida manualmente hasta volver a condicion normal.')
  }

  const centrarMapa = () => setCentrarMapaToken((token) => token + 1)

  const descargarReporteCSV = () => {
    const encabezados = [
      'idViaje',
      'horaInicioViaje',
      'horaEvento',
      'tipoEvento',
      'nivel',
      'desplazamiento',
      'duracion',
      'latitud',
      'longitud',
      'indiceRiesgoActual',
      'accion',
    ]
    const filas = eventosDetectados.map((evento) => [
      evento.idViaje,
      evento.horaInicioViaje,
      evento.horaEvento,
      evento.tipoEvento,
      evento.nivel,
      formatoNumero(evento.desplazamiento, 1),
      formatoNumero((evento.duracionMs || 0) / 1000, 2),
      evento.latitud,
      evento.longitud,
      evento.indiceRiesgoActual,
      evento.accion,
    ])
    const csv = [encabezados, ...filas]
      .map((fila) => fila.map(escaparCSV).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = `${idViaje || 'microsueno-viaje'}-reporte.csv`
    enlace.click()
    URL.revokeObjectURL(url)
  }

  const estadoDetector = detectorListo ? 'MediaPipe listo' : 'MediaPipe pendiente'
  const calibracionLista = Number.isFinite(referenciaNarizY)
  const audioRespaldoSrc = useMemo(() => crearAudioRespaldo(), [])
  const claseIndiceViaje =
    analisisViaje.indiceRiesgo <= 30
      ? 'bajo'
      : analisisViaje.indiceRiesgo <= 60
        ? 'medio'
        : 'alto'
  const riesgoEtiqueta = {
    bajo: 'Riesgo bajo',
    medio: 'Riesgo medio',
    alto: alarmaActiva ? 'Alarma activa' : 'Riesgo alto',
  }

  return (
    <main className="aplicacion">
      <header className="barra-superior">
        <div>
          <p className="etiqueta">GPS inteligente para transporte</p>
          <h1>{NOMBRE_APP}</h1>
        </div>
        <div className={`estado-riesgo ${estadoRiesgo} ${alarmaActiva ? 'alarma' : ''}`}>
          <span />
          {riesgoEtiqueta[estadoRiesgo]}
        </div>
      </header>

      <section className="tablero-viaje">
        <section className="tarjeta mapa-panel">
          <div className="titulo-panel">
            <div>
              <h2>Ruta en tiempo real</h2>
              <span>{viajeActivo ? 'Viaje activo' : 'Viaje detenido'}</span>
            </div>
            <strong>{formatoNumero(analisisViaje.kilometros, 2)} km</strong>
          </div>
          <RouteMap
            ubicacionActual={ubicacionActual}
            rutaRecorrida={rutaRecorrida}
            eventos={eventosDetectados}
            centrarMapaToken={centrarMapaToken}
          />
        </section>

        <section className="panel-operacion">
          <section className={`tarjeta camara-panel ${alarmaActiva ? 'alarma' : ''}`}>
            <div className="zona-video">
              <video
                ref={videoRef}
                className="video-camara espejo"
                playsInline
                muted
                aria-label="Video en vivo de la camara"
              />
              <canvas
                ref={canvasRef}
                className="lienzo-deteccion espejo"
                aria-label="Canvas con punto de nariz detectado"
              />
              {!camaraActiva && (
                <div className="cubierta-video">
                  <strong>Camara inactiva</strong>
                  <span>{textoEncuadre}</span>
                </div>
              )}
            </div>
          </section>

          <section className="acciones">
            <button className="boton primario" type="button" onClick={iniciarViaje} disabled={viajeActivo}>
              Iniciar viaje
            </button>
            <button className="boton peligro" type="button" onClick={finalizarViaje} disabled={!viajeActivo}>
              Finalizar viaje
            </button>
            <button className="boton secundario" type="button" onClick={centrarMapa}>
              Centrar mapa
            </button>
            <button
              className="boton secundario"
              type="button"
              onClick={iniciarCamara}
              disabled={camaraActiva || cargandoDetector}
            >
              {cargandoDetector ? 'Cargando...' : 'Iniciar camara'}
            </button>
            <button className="boton secundario" type="button" onClick={recalibrarManual} disabled={!camaraActiva}>
              {calibracionLista ? 'Recalibrar' : 'Calibrar'}
            </button>
            <button className="boton secundario" type="button" onClick={alternarSonido}>
              {sonidoActivo ? 'Silenciar sonido' : 'Activar sonido'}
            </button>
            <button className="boton peligro-suave" type="button" onClick={detenerAlarmaManual}>
              Detener alarma
            </button>
            <button
              className="boton oscuro"
              type="button"
              onClick={descargarReporteCSV}
              disabled={eventosDetectados.length === 0}
            >
              Descargar reporte CSV
            </button>
          </section>

          <section className="tarjeta estado-sistema">
            <p>{mensajeSistema}</p>
            <small>Instalable en Android desde Chrome</small>
            {autocalibracionActiva && <small>Autocalibracion activa</small>}
          </section>
        </section>
      </section>

      <section className="metricas">
        <article className="tarjeta metrica">
          <span>Estado camara</span>
          <strong>{estadoDetector}</strong>
        </article>
        <article className="tarjeta metrica">
          <span>Tipo actual</span>
          <strong>{tipoActual}</strong>
        </article>
        <article className="tarjeta metrica">
          <span>deltaY firmado</span>
          <strong>{formatoNumero(deltaY)} px</strong>
        </article>
        <article className="tarjeta metrica">
          <span>Desplazamiento absoluto</span>
          <strong>{formatoNumero(desplazamientoAbsoluto)} px</strong>
        </article>
        <article className="tarjeta metrica">
          <span>Tiempo evento actual</span>
          <strong>{formatoDuracionEvento(tiempoEventoActual)}</strong>
        </article>
        <article className="tarjeta metrica">
          <span>Posicion Y nariz</span>
          <strong>{formatoNumero(posicionNarizY)} px</strong>
        </article>
      </section>

      <section className="tarjeta analisis-datos">
        <div className="titulo-panel">
          <div>
            <h2>Analisis del viaje</h2>
            <span>Indice de riesgo del viaje: {analisisViaje.indiceRiesgo}/100</span>
          </div>
          <strong className={`nivel-indice ${claseIndiceViaje}`}>
            {analisisViaje.clasificacion}
          </strong>
        </div>
        <div className="resumen-analitico">
          <div>
            <span>Duracion del viaje</span>
            <strong>{formatoTiempo(analisisViaje.duracionViajeMs)}</strong>
          </div>
          <div>
            <span>Total de eventos</span>
            <strong>{analisisViaje.totalEventos}</strong>
          </div>
          <div>
            <span>Cabeza abajo</span>
            <strong>{analisisViaje.eventosCabezaAbajo}</strong>
          </div>
          <div>
            <span>Cabeza arriba</span>
            <strong>{analisisViaje.eventosCabezaArriba}</strong>
          </div>
          <div>
            <span>Rostro perdido</span>
            <strong>{analisisViaje.eventosRostroPerdido}</strong>
          </div>
          <div>
            <span>Nariz no detectada</span>
            <strong>{analisisViaje.eventosNarizNoDetectada}</strong>
          </div>
          <div>
            <span>Duracion maxima</span>
            <strong>{formatoDuracionEvento(analisisViaje.duracionMaxima)}</strong>
          </div>
          <div>
            <span>Duracion promedio</span>
            <strong>{formatoDuracionEvento(analisisViaje.duracionPromedio)}</strong>
          </div>
          <div>
            <span>Km recorridos</span>
            <strong>{formatoNumero(analisisViaje.kilometros, 2)}</strong>
          </div>
          <div>
            <span>Alertas por km</span>
            <strong>{formatoNumero(analisisViaje.alertasPorKm, 2)}</strong>
          </div>
        </div>
        <p className="recomendacion">{analisisViaje.recomendacion}</p>
      </section>

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
              {eventosDetectados.length === 0 ? (
                <tr>
                  <td colSpan="9" className="sin-eventos">
                    Sin eventos registrados
                  </td>
                </tr>
              ) : (
                eventosDetectados.map((evento) => (
                  <tr key={evento.id}>
                    <td>{evento.horaEvento}</td>
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

      <audio ref={audioRespaldoRef} src={audioRespaldoSrc} preload="auto" />
    </main>
  )
}

export default App
