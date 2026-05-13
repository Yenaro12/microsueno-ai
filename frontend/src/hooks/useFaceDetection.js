import { useCallback, useEffect, useRef, useState } from 'react'
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'
import { DETECTION, EVENT_TYPES, FACE_LANDMARKS, MEDIAPIPE, RISK_LEVELS, TEXTS } from '../utils/constants'

const UMBRAL_RETORNO_NORMAL_PX =
  DETECTION.UMBRAL_DESPLAZAMIENTO_PX * DETECTION.FACTOR_RETORNO_NORMAL

const INDICES_OJOS = {
  izquierdo: { superior: 159, inferior: 145, externo: 33, interno: 133 },
  derecho: { superior: 386, inferior: 374, externo: 362, interno: 263 },
}

const distancia = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)

export function useFaceDetection({
  registrarEvento,
  actualizarEvento,
  controlarAlarma,
  detenerAlarma,
  resetBloqueoManual,
  desbloquearAudio,
  onMessage,
} = {}) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const detectorRef = useRef(null)
  const flujoCamaraRef = useRef(null)
  const animacionRef = useRef(null)
  const detectarFrameRef = useRef(null)
  const posicionNarizActualRef = useRef(null)
  const referenciaNarizRef = useRef(null)
  const referenciaAlturaRostroRef = useRef(null)
  const calibracionRef = useRef({ activa: false, inicio: 0, muestras: [] })
  const historialNarizRef = useRef([])
  const ultimoFrameRiesgoRef = useRef(null)
  const puntajeRiesgoRef = useRef(0)
  const inicioEventoRef = useRef(null)
  const eventoActualIdRef = useRef(null)
  const tipoEventoActualRef = useRef(null)
  const estadoRiesgoRef = useRef(RISK_LEVELS.BAJO)
  const callbacksRef = useRef({})
  const marcasEventosRef = useRef({
    calibracion: false,
    descenso: false,
    postura: false,
    acumulado: false,
  })

  const [camaraActiva, setCamaraActiva] = useState(false)
  const [detectorListo, setDetectorListo] = useState(false)
  const [cargandoDetector, setCargandoDetector] = useState(false)
  const [estadoRiesgo, setEstadoRiesgo] = useState(RISK_LEVELS.BAJO)
  const [tipoActual, setTipoActual] = useState('Listo')
  const [posicionNarizY, setPosicionNarizY] = useState(null)
  const [referenciaNarizY, setReferenciaNarizY] = useState(null)
  const [deltaY, setDeltaY] = useState(0)
  const [desplazamientoAbsoluto, setDesplazamientoAbsoluto] = useState(0)
  const [tiempoEventoActual, setTiempoEventoActual] = useState(0)
  const [autocalibracionActiva, setAutocalibracionActiva] = useState(false)
  const [calibrandoReferencia, setCalibrandoReferencia] = useState(false)
  const [puntajeRiesgo, setPuntajeRiesgo] = useState(0)

  useEffect(() => {
    callbacksRef.current = {
      registrarEvento,
      actualizarEvento,
      controlarAlarma,
      detenerAlarma,
      resetBloqueoManual,
      desbloquearAudio,
      onMessage,
    }
  }, [actualizarEvento, controlarAlarma, desbloquearAudio, detenerAlarma, onMessage, registrarEvento, resetBloqueoManual])

  const actualizarRiesgo = useCallback((riesgo) => {
    estadoRiesgoRef.current = riesgo
    setEstadoRiesgo(riesgo)
  }, [])

  const registrarEventoSimple = useCallback((nivel, tipoEvento, desplazamiento, duracionMs, accion) => {
    callbacksRef.current.registrarEvento?.({
      nivel,
      tipoEvento,
      desplazamiento,
      duracionMs,
      accion,
    })
  }, [])

  const reiniciarCalibracion = useCallback((ahora = performance.now()) => {
    calibracionRef.current = { activa: true, inicio: ahora, muestras: [] }
    historialNarizRef.current = []
    puntajeRiesgoRef.current = 0
    ultimoFrameRiesgoRef.current = ahora
    referenciaNarizRef.current = null
    referenciaAlturaRostroRef.current = null
    marcasEventosRef.current = { calibracion: false, descenso: false, postura: false, acumulado: false }
    setPuntajeRiesgo(0)
    setCalibrandoReferencia(true)
    setAutocalibracionActiva(false)
    setTipoActual('Calibrando referencia')
  }, [])

  const prepararDetector = useCallback(async () => {
    if (detectorRef.current) return detectorRef.current
    setCargandoDetector(true)
    callbacksRef.current.onMessage?.('Cargando modelo de MediaPipe...')

    const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE.URL_WASM_MEDIAPIPE)
    const crearDetector = (delegate) =>
      FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MEDIAPIPE.URL_MODELO_CARA,
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
  }, [])

  const sincronizarCanvas = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth || 960
    canvas.height = video.videoHeight || 540
  }, [])

  const limpiarCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const contexto = canvas?.getContext('2d')
    if (canvas && contexto) contexto.clearRect(0, 0, canvas.width, canvas.height)
  }, [])

  const calcularMedidasRostro = useCallback((landmarksCara, canvas) => {
    const puntos = landmarksCara
      .filter((punto) => Number.isFinite(punto.x) && Number.isFinite(punto.y))
      .map((punto) => ({ x: punto.x * canvas.width, y: punto.y * canvas.height }))

    const minX = Math.min(...puntos.map((punto) => punto.x))
    const maxX = Math.max(...puntos.map((punto) => punto.x))
    const minY = Math.min(...puntos.map((punto) => punto.y))
    const maxY = Math.max(...puntos.map((punto) => punto.y))
    const altura = Math.max(1, maxY - minY)

    const puntoPixel = (indice) => ({
      x: landmarksCara[indice].x * canvas.width,
      y: landmarksCara[indice].y * canvas.height,
    })

    const ojoIzquierdo = INDICES_OJOS.izquierdo
    const ojoDerecho = INDICES_OJOS.derecho
    const aperturaIzquierda =
      distancia(puntoPixel(ojoIzquierdo.superior), puntoPixel(ojoIzquierdo.inferior)) /
      Math.max(1, distancia(puntoPixel(ojoIzquierdo.externo), puntoPixel(ojoIzquierdo.interno)))
    const aperturaDerecha =
      distancia(puntoPixel(ojoDerecho.superior), puntoPixel(ojoDerecho.inferior)) /
      Math.max(1, distancia(puntoPixel(ojoDerecho.externo), puntoPixel(ojoDerecho.interno)))

    return {
      minX,
      maxX,
      minY,
      maxY,
      altura,
      centroX: (minX + maxX) / 2,
      ojosCerrados: (aperturaIzquierda + aperturaDerecha) / 2 < 0.16,
    }
  }, [])

  const dibujarSeguimiento = useCallback((puntoNariz, medidas, porcentajeDescenso) => {
    const canvas = canvasRef.current
    const contexto = canvas?.getContext('2d')
    if (!canvas || !contexto) return

    contexto.clearRect(0, 0, canvas.width, canvas.height)

    if (medidas) {
      contexto.strokeStyle = 'rgba(56, 189, 248, 0.75)'
      contexto.lineWidth = 3
      contexto.strokeRect(medidas.minX, medidas.minY, medidas.maxX - medidas.minX, medidas.maxY - medidas.minY)
    }

    const referencia = referenciaNarizRef.current
    const alturaRostro = referenciaAlturaRostroRef.current || medidas?.altura || 1
    if (Number.isFinite(referencia)) {
      contexto.setLineDash([12, 10])
      contexto.strokeStyle = 'rgba(34, 197, 94, 0.9)'
      contexto.lineWidth = 4
      contexto.beginPath()
      contexto.moveTo(0, referencia)
      contexto.lineTo(canvas.width, referencia)
      contexto.stroke()
      contexto.setLineDash([])

      contexto.strokeStyle = 'rgba(245, 158, 11, 0.6)'
      contexto.lineWidth = 2
      contexto.beginPath()
      contexto.moveTo(0, referencia + alturaRostro * DETECTION.PORCENTAJE_ADVERTENCIA_DESCENSO)
      contexto.lineTo(canvas.width, referencia + alturaRostro * DETECTION.PORCENTAJE_ADVERTENCIA_DESCENSO)
      contexto.stroke()

      contexto.strokeStyle = 'rgba(239, 68, 68, 0.68)'
      contexto.beginPath()
      contexto.moveTo(0, referencia + alturaRostro * DETECTION.PORCENTAJE_ALTO_DESCENSO)
      contexto.lineTo(canvas.width, referencia + alturaRostro * DETECTION.PORCENTAJE_ALTO_DESCENSO)
      contexto.stroke()
    }

    contexto.strokeStyle = 'rgba(255, 255, 255, 0.9)'
    contexto.lineWidth = 3
    contexto.beginPath()
    contexto.moveTo(puntoNariz.x, medidas?.minY ?? 0)
    contexto.lineTo(puntoNariz.x, puntoNariz.y)
    contexto.stroke()

    contexto.fillStyle =
      estadoRiesgoRef.current === RISK_LEVELS.ALTO
        ? '#ef4444'
        : estadoRiesgoRef.current === RISK_LEVELS.MEDIO
          ? '#f59e0b'
          : '#22c55e'
    contexto.strokeStyle = 'rgba(255, 255, 255, 0.95)'
    contexto.lineWidth = 5
    contexto.beginPath()
    contexto.arc(puntoNariz.x, puntoNariz.y, 13, 0, Math.PI * 2)
    contexto.fill()
    contexto.stroke()

    contexto.fillStyle = 'rgba(15, 23, 42, 0.74)'
    contexto.fillRect(12, 12, 210, 48)
    contexto.fillStyle = '#f8fafc'
    contexto.font = 'bold 20px system-ui, sans-serif'
    contexto.fillText(`Riesgo ${Math.round(puntajeRiesgoRef.current)}/100`, 24, 42)
    if (Number.isFinite(porcentajeDescenso)) {
      contexto.font = '14px system-ui, sans-serif'
      contexto.fillText(`Descenso ${(porcentajeDescenso * 100).toFixed(0)}%`, 24, 57)
    }
  }, [])

  const actualizarPuntaje = useCallback((deltaPuntaje, ahora) => {
    const previo = ultimoFrameRiesgoRef.current ?? ahora
    const segundos = Math.min(0.12, Math.max(0.016, (ahora - previo) / 1000))
    ultimoFrameRiesgoRef.current = ahora
    const nuevo = Math.max(
      0,
      Math.min(DETECTION.PUNTAJE_RIESGO_MAXIMO, puntajeRiesgoRef.current + deltaPuntaje * segundos),
    )
    puntajeRiesgoRef.current = nuevo
    setPuntajeRiesgo(nuevo)
    return nuevo
  }, [])

  const actualizarReferenciaSuave = useCallback((posicionY, alturaRostro, velocidadDescenso, porcentajeDescenso) => {
    const referencia = referenciaNarizRef.current
    const referenciaAltura = referenciaAlturaRostroRef.current
    const puedeAjustar =
      Number.isFinite(referencia) &&
      Number.isFinite(referenciaAltura) &&
      estadoRiesgoRef.current === RISK_LEVELS.BAJO &&
      puntajeRiesgoRef.current < 8 &&
      Math.abs(porcentajeDescenso) < 0.04 &&
      Math.abs(velocidadDescenso) < 5

    if (!puedeAjustar) {
      setAutocalibracionActiva(false)
      return
    }

    const nuevaReferencia = referencia * 0.995 + posicionY * 0.005
    const nuevaAltura = referenciaAltura * 0.995 + alturaRostro * 0.005
    referenciaNarizRef.current = nuevaReferencia
    referenciaAlturaRostroRef.current = nuevaAltura
    setReferenciaNarizY(nuevaReferencia)
    setAutocalibracionActiva(true)
  }, [])

  const registrarEventoSiHaceFalta = useCallback((nivel, tipoEvento, desplazamiento, duracionMs, accion) => {
    if (eventoActualIdRef.current) {
      callbacksRef.current.actualizarEvento?.(eventoActualIdRef.current, {
        nivel,
        tipoEvento,
        desplazamiento,
        duracionMs,
        accion,
      })
      return
    }

    const idEvento = callbacksRef.current.registrarEvento?.({
      nivel,
      tipoEvento,
      desplazamiento,
      duracionMs,
      accion,
    })
    eventoActualIdRef.current = idEvento
  }, [])

  const finalizarEventoActual = useCallback((ahora = performance.now()) => {
    if (inicioEventoRef.current && eventoActualIdRef.current) {
      callbacksRef.current.actualizarEvento?.(eventoActualIdRef.current, {
        duracionMs: ahora - inicioEventoRef.current,
      })
    }
    inicioEventoRef.current = null
    eventoActualIdRef.current = null
    tipoEventoActualRef.current = null
    marcasEventosRef.current.descenso = false
    marcasEventosRef.current.postura = false
    marcasEventosRef.current.acumulado = false
    setTiempoEventoActual(0)
    setTipoActual('Normal')
    callbacksRef.current.resetBloqueoManual?.()
    callbacksRef.current.detenerAlarma?.()
  }, [])

  const iniciarOContinuarEvento = useCallback((tipoEvento, ahora) => {
    if (!inicioEventoRef.current || tipoEventoActualRef.current !== tipoEvento) {
      finalizarEventoActual(ahora)
      inicioEventoRef.current = ahora
      tipoEventoActualRef.current = tipoEvento
      callbacksRef.current.resetBloqueoManual?.()
    }
    return ahora - inicioEventoRef.current
  }, [finalizarEventoActual])

  const evaluarPerdidaDeteccion = useCallback((tipoEvento, ahora) => {
    setAutocalibracionActiva(false)
    setCalibrandoReferencia(false)
    setTipoActual(tipoEvento)
    setDeltaY(0)
    setDesplazamientoAbsoluto(0)
    const duracion = iniciarOContinuarEvento(tipoEvento, ahora)
    setTiempoEventoActual(duracion)
    actualizarPuntaje(55, ahora)

    if (duracion >= DETECTION.TIEMPO_ALARMA_FUERTE_MS) {
      actualizarRiesgo(RISK_LEVELS.ALTO)
      registrarEventoSiHaceFalta(
        RISK_LEVELS.ALARMA,
        tipoEvento,
        0,
        duracion,
        tipoEvento === EVENT_TYPES.ROSTRO_PERDIDO
          ? 'Alarma por rostro perdido'
          : 'Alarma por nariz no detectada',
      )
      callbacksRef.current.controlarAlarma?.(true, ahora)
      return
    }

    if (duracion >= DETECTION.TIEMPO_RIESGO_MEDIO_MS) {
      actualizarRiesgo(RISK_LEVELS.MEDIO)
      registrarEventoSiHaceFalta(
        RISK_LEVELS.MEDIO,
        tipoEvento,
        0,
        duracion,
        tipoEvento === EVENT_TYPES.ROSTRO_PERDIDO
          ? 'Rostro no detectado por mas de 1.5 s'
          : 'Nariz no detectada por mas de 1.5 s',
      )
    } else {
      actualizarRiesgo(RISK_LEVELS.BAJO)
    }
    callbacksRef.current.controlarAlarma?.(false, ahora)
  }, [actualizarPuntaje, actualizarRiesgo, iniciarOContinuarEvento, registrarEventoSiHaceFalta])

  const finalizarCalibracionSiLista = useCallback((posicionY, medidas, ahora) => {
    const calibracion = calibracionRef.current
    if (!calibracion.activa) return false

    calibracion.muestras.push({ y: posicionY, altura: medidas.altura })
    setTipoActual('Calibrando referencia')
    setCalibrandoReferencia(true)

    if (ahora - calibracion.inicio < DETECTION.TIEMPO_CALIBRACION_MS) return true

    const promedioY =
      calibracion.muestras.reduce((total, muestra) => total + muestra.y, 0) /
      Math.max(1, calibracion.muestras.length)
    const promedioAltura =
      calibracion.muestras.reduce((total, muestra) => total + muestra.altura, 0) /
      Math.max(1, calibracion.muestras.length)

    referenciaNarizRef.current = promedioY
    referenciaAlturaRostroRef.current = promedioAltura
    calibracionRef.current = { activa: false, inicio: 0, muestras: [] }
    setReferenciaNarizY(promedioY)
    setCalibrandoReferencia(false)
    setTipoActual('Referencia calibrada')
    callbacksRef.current.onMessage?.('Calibracion inicial completada. Monitoreo activo.')

    if (!marcasEventosRef.current.calibracion) {
      registrarEventoSimple(
        RISK_LEVELS.BAJO,
        EVENT_TYPES.CALIBRACION_COMPLETADA,
        0,
        DETECTION.TIEMPO_CALIBRACION_MS,
        'Calibracion inicial de rostro y nariz completada',
      )
      marcasEventosRef.current.calibracion = true
    }
    return true
  }, [registrarEventoSimple])

  const evaluarMovimientoCabeza = useCallback((posicionY, ahora, medidas) => {
    if (finalizarCalibracionSiLista(posicionY, medidas, ahora)) {
      dibujarSeguimiento({ x: medidas.centroX, y: posicionY }, medidas, 0)
      return
    }

    const referencia = referenciaNarizRef.current
    const alturaReferencia = referenciaAlturaRostroRef.current || medidas.altura
    if (!Number.isFinite(referencia) || !Number.isFinite(alturaReferencia)) {
      referenciaNarizRef.current = posicionY
      referenciaAlturaRostroRef.current = medidas.altura
      setReferenciaNarizY(posicionY)
      actualizarRiesgo(RISK_LEVELS.BAJO)
      setTipoActual('Referencia inicial')
      return
    }

    const nuevoDeltaY = posicionY - referencia
    const absoluto = Math.abs(nuevoDeltaY)
    const porcentajeDescenso = nuevoDeltaY / Math.max(1, alturaReferencia)
    const tipoEvento = nuevoDeltaY >= 0 ? EVENT_TYPES.CABEZA_ABAJO : EVENT_TYPES.CABEZA_ARRIBA

    historialNarizRef.current = [...historialNarizRef.current, { y: posicionY, t: ahora }].filter(
      (muestra) => ahora - muestra.t <= 1400,
    )
    const primeraMuestra = historialNarizRef.current[0]
    const segundosHistorial = primeraMuestra ? Math.max(0.2, (ahora - primeraMuestra.t) / 1000) : 1
    const velocidadDescenso = primeraMuestra ? (posicionY - primeraMuestra.y) / segundosHistorial : 0

    const descensoAdvertencia = porcentajeDescenso >= DETECTION.PORCENTAJE_ADVERTENCIA_DESCENSO
    const descensoAlto = porcentajeDescenso >= DETECTION.PORCENTAJE_ALTO_DESCENSO || nuevoDeltaY >= DETECTION.UMBRAL_DESPLAZAMIENTO_PX
    const cabezaArribaAlto = porcentajeDescenso <= -DETECTION.PORCENTAJE_ALTO_DESCENSO || nuevoDeltaY <= -DETECTION.UMBRAL_DESPLAZAMIENTO_PX
    const descensoProgresivo =
      velocidadDescenso >= DETECTION.VELOCIDAD_DESCENSO_LENTO_PX_S &&
      porcentajeDescenso >= 0.05
    const ojosCerrados = medidas.ojosCerrados

    let cambioPuntaje = -22
    if (descensoAlto || cabezaArribaAlto) cambioPuntaje = 38
    else if (descensoAdvertencia) cambioPuntaje = 26
    else if (descensoProgresivo) cambioPuntaje = 18
    if (ojosCerrados && (descensoAdvertencia || descensoProgresivo)) cambioPuntaje += 14

    const nuevoPuntaje = actualizarPuntaje(cambioPuntaje, ahora)

    setDeltaY(nuevoDeltaY)
    setDesplazamientoAbsoluto(absoluto)
    dibujarSeguimiento({ x: medidas.centroX, y: posicionY }, medidas, porcentajeDescenso)

    const retornoNormal =
      Math.abs(porcentajeDescenso) <= DETECTION.PORCENTAJE_RETORNO_NORMAL &&
      absoluto <= UMBRAL_RETORNO_NORMAL_PX &&
      nuevoPuntaje < 14

    if (retornoNormal) {
      finalizarEventoActual(ahora)
      actualizarRiesgo(RISK_LEVELS.BAJO)
      actualizarReferenciaSuave(posicionY, medidas.altura, velocidadDescenso, porcentajeDescenso)
      callbacksRef.current.controlarAlarma?.(false, ahora)
      return
    }

    setAutocalibracionActiva(false)

    if (descensoProgresivo && !marcasEventosRef.current.descenso) {
      registrarEventoSimple(
        RISK_LEVELS.MEDIO,
        EVENT_TYPES.SOMNOLENCIA_PROGRESIVA,
        nuevoDeltaY,
        0,
        'Nariz descendiendo progresivamente',
      )
      marcasEventosRef.current.descenso = true
    }

    const hayRiesgo = descensoAdvertencia || descensoAlto || cabezaArribaAlto || descensoProgresivo || nuevoPuntaje >= DETECTION.PUNTAJE_RIESGO_ADVERTENCIA
    const eventoRiesgo =
      nuevoPuntaje >= DETECTION.PUNTAJE_RIESGO_ADVERTENCIA || descensoProgresivo
        ? EVENT_TYPES.SOMNOLENCIA_PROGRESIVA
        : tipoEvento

    if (!hayRiesgo) {
      actualizarRiesgo(RISK_LEVELS.BAJO)
      callbacksRef.current.controlarAlarma?.(false, ahora)
      return
    }

    const duracion = iniciarOContinuarEvento(eventoRiesgo, ahora)
    setTiempoEventoActual(duracion)
    setTipoActual(eventoRiesgo)

    if ((descensoAdvertencia || descensoProgresivo) && !marcasEventosRef.current.postura && duracion > 600) {
      registrarEventoSimple(
        RISK_LEVELS.MEDIO,
        EVENT_TYPES.POSTURA_RIESGO,
        nuevoDeltaY,
        duracion,
        'Postura de riesgo detectada por nariz y rostro',
      )
      marcasEventosRef.current.postura = true
    }

    const debeAlarmarPorPostura = (descensoAlto || cabezaArribaAlto) && duracion >= DETECTION.TIEMPO_RIESGO_ALTO_MS
    const debeAlarmarPorAcumulado = nuevoPuntaje >= DETECTION.PUNTAJE_RIESGO_ALARMA
    const debeAlarmarPorGradual = descensoProgresivo && duracion >= DETECTION.TIEMPO_ALARMA_FUERTE_MS

    if (debeAlarmarPorPostura || debeAlarmarPorAcumulado || debeAlarmarPorGradual) {
      actualizarRiesgo(RISK_LEVELS.ALTO)
      registrarEventoSiHaceFalta(
        RISK_LEVELS.ALARMA,
        debeAlarmarPorAcumulado ? EVENT_TYPES.SOMNOLENCIA_PROGRESIVA : tipoEvento,
        nuevoDeltaY,
        duracion,
        debeAlarmarPorAcumulado
          ? 'Alarma activada por somnolencia gradual y riesgo acumulado alto'
          : tipoEvento === EVENT_TYPES.CABEZA_ABAJO
            ? 'Microsueno detectado por descenso sostenido de nariz'
            : 'Alarma fuerte por cabeza arriba',
      )
      if (debeAlarmarPorAcumulado && !marcasEventosRef.current.acumulado) {
        registrarEventoSimple(
          RISK_LEVELS.ALARMA,
          EVENT_TYPES.SOMNOLENCIA_PROGRESIVA,
          nuevoDeltaY,
          duracion,
          'Riesgo acumulado alto por somnolencia progresiva',
        )
        marcasEventosRef.current.acumulado = true
      }
      callbacksRef.current.controlarAlarma?.(true, ahora)
      return
    }

    actualizarRiesgo(RISK_LEVELS.MEDIO)
    registrarEventoSiHaceFalta(
      RISK_LEVELS.MEDIO,
      eventoRiesgo,
      nuevoDeltaY,
      duracion,
      descensoProgresivo ? 'Nariz descendiendo lentamente; acumulando riesgo' : 'Postura de riesgo detectada',
    )
    callbacksRef.current.controlarAlarma?.(false, ahora)
  }, [actualizarPuntaje, actualizarReferenciaSuave, actualizarRiesgo, dibujarSeguimiento, finalizarCalibracionSiLista, finalizarEventoActual, iniciarOContinuarEvento, registrarEventoSiHaceFalta, registrarEventoSimple])

  const detectarEnVideo = useCallback((detector) => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    if (video.readyState < 2) {
      animacionRef.current = requestAnimationFrame(() => detectarFrameRef.current?.(detector))
      return
    }

    sincronizarCanvas()
    const ahora = performance.now()
    const resultado = detector.detectForVideo(video, ahora)
    const landmarksCara = resultado.faceLandmarks?.[0]

    if (!landmarksCara) {
      posicionNarizActualRef.current = null
      limpiarCanvas()
      evaluarPerdidaDeteccion(EVENT_TYPES.ROSTRO_PERDIDO, ahora)
      animacionRef.current = requestAnimationFrame(() => detectarFrameRef.current?.(detector))
      return
    }

    const puntoNariz = landmarksCara[FACE_LANDMARKS.INDICE_PUNTO_NARIZ]
    if (!puntoNariz || !Number.isFinite(puntoNariz.x) || !Number.isFinite(puntoNariz.y)) {
      limpiarCanvas()
      evaluarPerdidaDeteccion(EVENT_TYPES.NARIZ_NO_DETECTADA, ahora)
      animacionRef.current = requestAnimationFrame(() => detectarFrameRef.current?.(detector))
      return
    }

    const medidas = calcularMedidasRostro(landmarksCara, canvas)
    const posicionNariz = {
      x: puntoNariz.x * canvas.width,
      y: puntoNariz.y * canvas.height,
    }

    posicionNarizActualRef.current = posicionNariz
    setPosicionNarizY(posicionNariz.y)
    evaluarMovimientoCabeza(posicionNariz.y, ahora, medidas)
    animacionRef.current = requestAnimationFrame(() => detectarFrameRef.current?.(detector))
  }, [calcularMedidasRostro, evaluarMovimientoCabeza, evaluarPerdidaDeteccion, limpiarCanvas, sincronizarCanvas])

  useEffect(() => {
    detectarFrameRef.current = detectarEnVideo
  }, [detectarEnVideo])

  const iniciarCamara = useCallback(async () => {
    try {
      await callbacksRef.current.desbloquearAudio?.()
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
      reiniciarCalibracion(performance.now())
      setCamaraActiva(true)
      callbacksRef.current.onMessage?.('Camara activa. Mantente normal unos segundos para calibrar.')
      detectarEnVideo(detector)
      return true
    } catch (error) {
      setCargandoDetector(false)
      callbacksRef.current.onMessage?.('No se pudo iniciar la camara. Revisa permisos o usa localhost/HTTPS.')
      console.error(error)
      return false
    }
  }, [detectarEnVideo, prepararDetector, reiniciarCalibracion, sincronizarCanvas])

  const detenerCamara = useCallback(() => {
    if (animacionRef.current) {
      cancelAnimationFrame(animacionRef.current)
      animacionRef.current = null
    }
    flujoCamaraRef.current?.getTracks().forEach((track) => track.stop())
    flujoCamaraRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCamaraActiva(false)
  }, [])

  const recalibrarManual = useCallback(() => {
    const posicionActual = posicionNarizActualRef.current
    if (!posicionActual) {
      callbacksRef.current.onMessage?.('Aun no detecto la nariz. Mantente de frente a la camara.')
      return
    }
    reiniciarCalibracion(performance.now())
    callbacksRef.current.resetBloqueoManual?.()
    callbacksRef.current.detenerAlarma?.()
  }, [reiniciarCalibracion])

  const marcarAlarmaDetenidaManual = useCallback(() => {
    if (eventoActualIdRef.current) {
      callbacksRef.current.actualizarEvento?.(eventoActualIdRef.current, {
        accion: 'Alarma detenida manualmente',
      })
    }
  }, [])

  useEffect(() => {
    return () => {
      detenerCamara()
      detectorRef.current?.close()
    }
  }, [detenerCamara])

  return {
    videoRef,
    canvasRef,
    camaraActiva,
    detectorListo,
    cargandoDetector,
    estadoRiesgo,
    tipoActual,
    posicionNarizY,
    referenciaNarizY,
    deltaY,
    desplazamientoAbsoluto,
    tiempoEventoActual,
    autocalibracionActiva,
    calibrandoReferencia,
    puntajeRiesgo,
    iniciarCamara,
    detenerCamara,
    recalibrarManual,
    finalizarEventoActual,
    marcarAlarmaDetenidaManual,
    textoEncuadre: TEXTS.ENCUADRE,
  }
}
