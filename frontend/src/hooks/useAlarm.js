import { useCallback, useMemo, useRef, useState } from 'react'
import { DETECTION } from '../utils/constants'

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

export function useAlarm() {
  const audioContextoRef = useRef(null)
  const audioRespaldoRef = useRef(null)
  const ultimoBeepRef = useRef(0)
  const alarmaDetenidaManualRef = useRef(false)
  const sonidoActivoRef = useRef(true)

  const [sonidoActivo, setSonidoActivo] = useState(true)
  const [alarmaActiva, setAlarmaActiva] = useState(false)
  const audioRespaldoSrc = useMemo(() => crearAudioRespaldo(), [])

  const setAudioRespaldoNode = useCallback((node) => {
    audioRespaldoRef.current = node
  }, [])

  const emitirBeepRespaldo = useCallback(async () => {
    try {
      const audio = audioRespaldoRef.current
      if (!audio) return
      audio.currentTime = 0
      audio.volume = 1
      await audio.play()
    } catch {
      console.warn('No se pudo reproducir el audio de respaldo')
    }
  }, [])

  const emitirBeepAlarma = useCallback(async () => {
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
  }, [emitirBeepRespaldo])

  const detenerAlarma = useCallback(() => {
    ultimoBeepRef.current = 0
    setAlarmaActiva(false)
    if ('vibrate' in navigator) navigator.vibrate(0)
  }, [])

  const controlarAlarma = useCallback(
    (debeSonar, ahora) => {
      if (!debeSonar || alarmaDetenidaManualRef.current || !sonidoActivoRef.current) {
        detenerAlarma()
        return
      }

      setAlarmaActiva(true)
      if (ahora - ultimoBeepRef.current >= DETECTION.INTERVALO_BEEP_ALARMA_MS) {
        emitirBeepAlarma()
        ultimoBeepRef.current = ahora
      }
    },
    [detenerAlarma, emitirBeepAlarma],
  )

  const desbloquearAudio = useCallback(async () => {
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
      console.warn('AudioContext no disponible; se usara audio de respaldo si es posible')
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
      // Algunos navegadores bloquean el respaldo hasta que exista una alarma real.
    }
  }, [])

  const alternarSonido = useCallback(() => {
    setSonidoActivo((activo) => {
      const nuevoEstado = !activo
      sonidoActivoRef.current = nuevoEstado
      if (!nuevoEstado) {
        alarmaDetenidaManualRef.current = true
        detenerAlarma()
      } else {
        alarmaDetenidaManualRef.current = false
        desbloquearAudio()
      }
      return nuevoEstado
    })
  }, [desbloquearAudio, detenerAlarma])

  const detenerAlarmaManual = useCallback(() => {
    alarmaDetenidaManualRef.current = true
    detenerAlarma()
  }, [detenerAlarma])

  const resetBloqueoManual = useCallback(() => {
    alarmaDetenidaManualRef.current = false
  }, [])

  return {
    setAudioRespaldoNode,
    audioRespaldoSrc,
    sonidoActivo,
    alarmaActiva,
    desbloquearAudio,
    controlarAlarma,
    detenerAlarma,
    detenerAlarmaManual,
    alternarSonido,
    resetBloqueoManual,
  }
}
