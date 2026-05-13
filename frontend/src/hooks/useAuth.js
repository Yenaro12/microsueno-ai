import { useCallback, useState } from 'react'
import { STORAGE_KEYS } from '../utils/constants'
import { normalizarConductor } from '../utils/driverIdentity'

const usuarioInicial = {
  nombre: 'Conductor Demo',
  correo: 'conductor@microsueno.ai',
}

const prepararUsuario = (usuario) => {
  const conductor = normalizarConductor(usuario)
  return {
    ...usuario,
    id: conductor.driverId,
    driverId: conductor.driverId,
    nombre: conductor.driverName,
    correo: conductor.driverEmail,
  }
}

const leerSesionInicial = () => {
  try {
    const usuarioGuardado = localStorage.getItem(STORAGE_KEYS.USUARIO)
    const sesionGuardada = localStorage.getItem(STORAGE_KEYS.SESION_ACTIVA)
    if (usuarioGuardado && sesionGuardada === 'true') {
      return {
        usuario: prepararUsuario(JSON.parse(usuarioGuardado)),
        autenticado: true,
      }
    }
  } catch {
    // Si localStorage falla, la app inicia sin sesion.
  }

  return {
    usuario: null,
    autenticado: false,
  }
}

export function useAuth() {
  const [sesion, setSesion] = useState(leerSesionInicial)

  const guardarSesion = useCallback((nuevoUsuario) => {
    const usuarioNormalizado = prepararUsuario(nuevoUsuario)
    localStorage.setItem(STORAGE_KEYS.USUARIO, JSON.stringify(usuarioNormalizado))
    localStorage.setItem(STORAGE_KEYS.SESION_ACTIVA, 'true')
    setSesion({ usuario: usuarioNormalizado, autenticado: true })
  }, [])

  const iniciarSesion = useCallback(({ correo, password }) => {
    const correoLimpio = String(correo || '').trim().toLowerCase()
    if (!correoLimpio || !password) {
      return { ok: false, mensaje: 'Ingresa correo y contrasena.' }
    }

    const usuarioGuardado = localStorage.getItem(STORAGE_KEYS.USUARIO)
    const usuarioBase = usuarioGuardado ? JSON.parse(usuarioGuardado) : usuarioInicial
    const usuarioSesion = {
      ...usuarioBase,
      correo: correoLimpio,
      nombre: usuarioBase.nombre || correoLimpio.split('@')[0],
    }
    guardarSesion(usuarioSesion)
    return { ok: true }
  }, [guardarSesion])

  const registrarUsuario = useCallback(({ nombre, correo, password }) => {
    const nombreLimpio = String(nombre || '').trim()
    const correoLimpio = String(correo || '').trim().toLowerCase()
    if (!nombreLimpio || !correoLimpio || !password) {
      return { ok: false, mensaje: 'Completa nombre, correo y contrasena.' }
    }

    guardarSesion({ nombre: nombreLimpio, correo: correoLimpio })
    return { ok: true }
  }, [guardarSesion])

  const cerrarSesion = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.SESION_ACTIVA, 'false')
    setSesion((actual) => ({ usuario: actual.usuario, autenticado: false }))
  }, [])

  return {
    usuario: sesion.usuario,
    autenticado: sesion.autenticado,
    iniciarSesion,
    registrarUsuario,
    cerrarSesion,
  }
}
