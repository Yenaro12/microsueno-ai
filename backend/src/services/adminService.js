import { readStorage } from '../utils/fileStorage.js'

const normalizarNivel = (nivel = '') => String(nivel || '').toLowerCase()

const obtenerDriverId = (registro = {}) =>
  registro.driverId || registro.driver_id || registro.driverEmail || registro.driver_email || 'driver-sin-asignar'

const obtenerDriver = (registro = {}) => ({
  driverId: obtenerDriverId(registro),
  driverName: registro.driverName || registro.driver_name || 'Conductor sin asignar',
  driverEmail: registro.driverEmail || registro.driver_email || '',
})

const calcularIndiceRiesgo = (events = []) => {
  const puntosEventos = events.reduce((total, event) => {
    const level = normalizarNivel(event.level)
    let puntos = total
    if (level === 'medio') puntos += 5
    if (level === 'alto') puntos += 10
    if (level === 'alarma') puntos += 20
    if (event.type === 'Rostro perdido') puntos += 15
    if (event.type === 'Nariz no detectada') puntos += 15
    return puntos
  }, 0)

  const duracionMaxima = events.reduce(
    (maximo, event) => Math.max(maximo, Number(event.durationMs ?? event.duration * 1000 ?? 0)),
    0,
  )
  const puntosDuracion = duracionMaxima > 5000 ? 15 : 0
  const puntosAlertas = events.length > 3 ? 15 : 0
  return Math.min(100, puntosEventos + puntosDuracion + puntosAlertas)
}

const crearEstadisticas = (events = [], trips = []) => {
  const duraciones = events.map((event) => Number(event.durationMs ?? event.duration * 1000 ?? 0))
  const duracionMaximaMs = duraciones.reduce((maximo, duracion) => Math.max(maximo, duracion), 0)
  const duracionPromedioMs = duraciones.length
    ? duraciones.reduce((total, duracion) => total + duracion, 0) / duraciones.length
    : 0
  const kilometros = trips.reduce((total, trip) => total + Number(trip.distanceKm || 0), 0)
  const indiceRiesgo = calcularIndiceRiesgo(events)

  return {
    totalViajes: trips.length,
    viajesActivos: trips.filter((trip) => trip.status === 'active').length,
    totalEventos: events.length,
    alertas: events.filter((event) => normalizarNivel(event.level) === 'alarma').length,
    eventosCabezaAbajo: events.filter((event) => event.type === 'Cabeza abajo').length,
    eventosCabezaArriba: events.filter((event) => event.type === 'Cabeza arriba').length,
    eventosRostroPerdido: events.filter((event) => event.type === 'Rostro perdido').length,
    eventosNarizNoDetectada: events.filter((event) => event.type === 'Nariz no detectada').length,
    duracionMaximaMs,
    duracionPromedioMs,
    kilometros,
    alertasPorKm: kilometros > 0 ? events.length / kilometros : 0,
    indiceRiesgo,
  }
}

export async function getDriversForAdmin() {
  const data = await readStorage()
  const mapa = new Map()

  ;[...data.trips, ...data.events].forEach((registro) => {
    const driver = obtenerDriver(registro)
    if (!mapa.has(driver.driverId)) mapa.set(driver.driverId, driver)
  })

  return [...mapa.values()].sort((a, b) => a.driverName.localeCompare(b.driverName))
}

export async function getDriverSummary(driverId) {
  const data = await readStorage()
  const trips = data.trips.filter((trip) => obtenerDriverId(trip) === driverId)
  const events = data.events.filter((event) => obtenerDriverId(event) === driverId)
  const driver = obtenerDriver(trips[0] || events[0] || { driverId })
  const eventosOrdenados = [...events].sort((a, b) => new Date(b.time) - new Date(a.time))

  return {
    driver,
    trips,
    events: eventosOrdenados,
    latestAlerts: eventosOrdenados.slice(0, 12),
    stats: crearEstadisticas(events, trips),
  }
}
