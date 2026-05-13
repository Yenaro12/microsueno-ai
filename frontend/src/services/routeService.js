import { calcularDistanciaMetros } from '../utils/distanceCalculator'

const OSRM_BASE_URL = import.meta.env.VITE_OSRM_URL || 'https://router.project-osrm.org/route/v1/driving'
const NOMINATIM_BASE_URL = import.meta.env.VITE_NOMINATIM_URL || 'https://nominatim.openstreetmap.org/search'

export function parsearCoordenadasEntrada(entrada) {
  const texto = String(entrada || '').trim()
  if (!texto) return null

  const partes = texto
    .replaceAll(';', ',')
    .split(/[ ,]+/)
    .map((parte) => Number(parte.trim()))
    .filter((valor) => Number.isFinite(valor))

  if (partes.length < 2) return null

  const [latitud, longitud] = partes
  if (Math.abs(latitud) > 90 || Math.abs(longitud) > 180) return null

  return {
    latitud,
    longitud,
    etiqueta: `${latitud.toFixed(6)}, ${longitud.toFixed(6)}`,
  }
}

export async function resolverPuntoRuta(entrada) {
  const coordenadas = parsearCoordenadasEntrada(entrada)
  if (coordenadas) return coordenadas

  const texto = String(entrada || '').trim()
  if (!texto) throw new Error('Ingresa un punto de ruta valido.')

  const url = new URL(NOMINATIM_BASE_URL)
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('limit', '1')
  url.searchParams.set('q', texto)
  url.searchParams.set('accept-language', 'es')

  const respuesta = await fetch(url.toString())
  if (!respuesta.ok) throw new Error('No se pudo buscar la direccion.')

  const resultados = await respuesta.json()
  const primero = resultados?.[0]
  if (!primero) throw new Error('No se encontro ese punto. Prueba con coordenadas lat,lng.')

  return {
    latitud: Number(primero.lat),
    longitud: Number(primero.lon),
    etiqueta: primero.display_name || texto,
  }
}

export async function calcularRutaOsrm(origen, destino) {
  const coordenadas = `${origen.longitud},${origen.latitud};${destino.longitud},${destino.latitud}`
  const url = new URL(`${OSRM_BASE_URL}/${coordenadas}`)
  url.searchParams.set('overview', 'full')
  url.searchParams.set('geometries', 'geojson')
  url.searchParams.set('steps', 'false')

  const respuesta = await fetch(url.toString())
  if (!respuesta.ok) throw new Error('OSRM no respondio correctamente.')

  const data = await respuesta.json()
  const ruta = data.routes?.[0]
  if (!ruta?.geometry?.coordinates?.length) throw new Error('OSRM no regreso una ruta valida.')

  return {
    puntos: ruta.geometry.coordinates.map(([longitud, latitud]) => ({ latitud, longitud })),
    distanciaKm: ruta.distance / 1000,
    duracionMinutos: ruta.duration / 60,
    fuente: 'OSRM publico',
    fallback: false,
  }
}

export function crearRutaDirecta(origen, destino) {
  return {
    puntos: [origen, destino],
    distanciaKm: calcularDistanciaMetros(origen, destino) / 1000,
    duracionMinutos: 0,
    fuente: 'Linea directa sin OSRM',
    fallback: true,
  }
}