import { useCallback, useEffect, useRef, useState } from 'react'
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'
import { DETECTION, EVENT_TYPES, FACE_LANDMARKS, MEDIAPIPE, RISK_LEVELS, TEXTS } from '../utils/constants'

const UMBRAL_RETORNO_NORMAL_PX =
  DETECTION.UMBRAL_DESPLAZAMIENTO_PX * DETECTION.FACTOR_RETORNO_NORMAL

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
  const inicioEventoRef = useRef(null)
  const eventoActualIdRef = useRef(null)
  const tipoEventoActualRef = useRef(null)
  const estadoRiesgoRef = useRef(RISK_LEVELS.BAJO)
  const callbacksRef = useRef({})

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

  const dibujarNariz = useCallback((puntoNariz) => {
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
      contexto.moveTo(0, referencia + DETECTION.UMBRAL_DESPLAZAMIENTO_PX)
      contexto.lineTo(canvas.width, referencia + DETECTION.UMBRAL_DESPLAZAMIENTO_PX)
      contexto.moveTo(0, referencia - DETECTION.UMBRAL_DESPLAZAMIENTO_PX)
      contexto.lineTo(canvas.width, referencia - DETECTION.UMBRAL_DESPLAZAMIENTO_PX)
      contexto.stroke()
    }

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
  }, [])

  const actualizarReferenciaSuave = useCallback((posicionY) => {
    const referencia = referenciaNarizRef.current
    if (!Number.isFinite(referencia) || estadoRiesgoRef.current !== RISK_LEVELS.BAJO) {
      setAutocalibracionActiva(false)
      return
    }
    const nuevaReferencia = referencia * 0.98 + posicionY * 0.02
    referenciaNarizRef.current = nuevaReferencia
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
    setTipoActual(tipoEvento)
    setDeltaY(0)
    setDesplazamientoAbsoluto(0)
    const duracion = iniciarOContinuarEvento(tipoEvento, ahora)
    setTiempoEventoActual(duracion)

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
          ? 'Rostro no detectado por mas de 2 s'
          : 'Nariz no detectada por mas de 2 s',
      )
    } else {
      actualizarRiesgo(RISK_LEVELS.BAJO)
    }
    callbacksRef.current.controlarAlarma?.(false, ahora)
  }, [actualizarRiesgo, iniciarOContinuarEvento, registrarEventoSiHaceFalta])

  const evaluarMovimientoCabeza = useCallback((posicionY, ahora) => {
    const referencia = referenciaNarizRef.current
    if (!Number.isFinite(referencia)) {
      referenciaNarizRef.current = posicionY
      setReferenciaNarizY(posicionY)
      actualizarRiesgo(RISK_LEVELS.BAJO)
      setTipoActual('Referencia inicial')
      return
    }

    const nuevoDeltaY = posicionY - referencia
    const absoluto = Math.abs(nuevoDeltaY)
    const tipoEvento = nuevoDeltaY >= 0 ? EVENT_TYPES.CABEZA_ABAJO : EVENT_TYPES.CABEZA_ARRIBA

    setDeltaY(nuevoDeltaY)
    setDesplazamientoAbsoluto(absoluto)

    if (absoluto <= UMBRAL_RETORNO_NORMAL_PX) {
      finalizarEventoActual(ahora)
      actualizarRiesgo(RISK_LEVELS.BAJO)
      actualizarReferenciaSuave(posicionY)
      return
    }

    if (absoluto <= DETECTION.UMBRAL_DESPLAZAMIENTO_PX) {
      finalizarEventoActual(ahora)
      actualizarRiesgo(RISK_LEVELS.BAJO)
      actualizarReferenciaSuave(posicionY)
      return
    }

    setAutocalibracionActiva(false)
    setTipoActual(tipoEvento)
    const duracion = iniciarOContinuarEvento(tipoEvento, ahora)
    setTiempoEventoActual(duracion)

    if (duracion >= DETECTION.TIEMPO_ALARMA_FUERTE_MS) {
      actualizarRiesgo(RISK_LEVELS.ALTO)
      registrarEventoSiHaceFalta(
        RISK_LEVELS.ALARMA,
        tipoEvento,
        nuevoDeltaY,
        duracion,
        tipoEvento === EVENT_TYPES.CABEZA_ABAJO
          ? 'Alarma fuerte por cabeza abajo'
          : 'Alarma fuerte por cabeza arriba',
      )
      callbacksRef.current.controlarAlarma?.(true, ahora)
      return
    }

    if (duracion >= DETECTION.TIEMPO_RIESGO_ALTO_MS) {
      actualizarRiesgo(RISK_LEVELS.ALTO)
      registrarEventoSiHaceFalta(
        RISK_LEVELS.ALTO,
        tipoEvento,
        nuevoDeltaY,
        duracion,
        tipoEvento === EVENT_TYPES.CABEZA_ABAJO
          ? 'Riesgo alto por cabeza abajo'
          : 'Riesgo alto por cabeza arriba',
      )
      callbacksRef.current.controlarAlarma?.(true, ahora)
      return
    }

    actualizarRiesgo(RISK_LEVELS.BAJO)
    callbacksRef.current.controlarAlarma?.(false, ahora)
  }, [actualizarReferenciaSuave, actualizarRiesgo, finalizarEventoActual, iniciarOContinuarEvento, registrarEventoSiHaceFalta])

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

    const posicionNariz = {
      x: puntoNariz.x * canvas.width,
      y: puntoNariz.y * canvas.height,
    }

    posicionNarizActualRef.current = posicionNariz
    setPosicionNarizY(posicionNariz.y)
    evaluarMovimientoCabeza(posicionNariz.y, ahora)
    dibujarNariz(posicionNariz)
    animacionRef.current = requestAnimationFrame(() => detectarFrameRef.current?.(detector))
  }, [dibujarNariz, evaluarMovimientoCabeza, evaluarPerdidaDeteccion, limpiarCanvas, sincronizarCanvas])

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
      setCamaraActiva(true)
      callbacksRef.current.onMessage?.('Camara activa. Mantente dentro del encuadre.')
      detectarEnVideo(detector)
      return true
    } catch (error) {
      setCargandoDetector(false)
      callbacksRef.current.onMessage?.('No se pudo iniciar la camara. Revisa permisos o usa localhost/HTTPS.')
      console.error(error)
      return false
    }
  }, [detectarEnVideo, prepararDetector, sincronizarCanvas])

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
    referenciaNarizRef.current = posicionActual.y
    setReferenciaNarizY(posicionActual.y)
    setDeltaY(0)
    setDesplazamientoAbsoluto(0)
    setTiempoEventoActual(0)
    setTipoActual('Referencia calibrada')
    callbacksRef.current.resetBloqueoManual?.()
    callbacksRef.current.detenerAlarma?.()
  }, [])

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
    iniciarCamara,
    detenerCamara,
    recalibrarManual,
    finalizarEventoActual,
    marcarAlarmaDetenidaManual,
    textoEncuadre: TEXTS.ENCUADRE,
  }
}

