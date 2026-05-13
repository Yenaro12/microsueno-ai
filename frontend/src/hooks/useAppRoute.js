import { useCallback, useEffect, useState } from 'react'

const obtenerRuta = () => window.location.pathname || '/'

export function useAppRoute() {
  const [ruta, setRuta] = useState(obtenerRuta)

  useEffect(() => {
    const manejarPopState = () => setRuta(obtenerRuta())
    window.addEventListener('popstate', manejarPopState)
    return () => window.removeEventListener('popstate', manejarPopState)
  }, [])

  const navegar = useCallback((siguienteRuta) => {
    window.history.pushState({}, '', siguienteRuta)
    setRuta(obtenerRuta())
  }, [])

  return {
    ruta,
    esAdmin: ruta.startsWith('/admin'),
    navegar,
  }
}
