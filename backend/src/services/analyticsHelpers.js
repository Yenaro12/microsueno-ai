export const normNivel = (n = '') => String(n).toLowerCase()

export const getDriverId = (r = {}) =>
  r.driverId || r.driver_id || r.driverEmail || r.driver_email || 'sin-asignar'

export const getDriverInfo = (r = {}) => ({
  driverId: getDriverId(r),
  driverName: r.driverName || r.driver_name || 'Conductor sin asignar',
  driverEmail: r.driverEmail || r.driver_email || '',
})

export const calcIndiceRiesgo = (events = []) => {
  const pts = events.reduce((acc, e) => {
    const n = normNivel(e.level)
    if (n === 'medio') acc += 5
    if (n === 'alto') acc += 10
    if (n === 'alarma') acc += 20
    if (e.type === 'Rostro perdido') acc += 15
    if (e.type === 'Nariz no detectada') acc += 15
    return acc
  }, 0)
  const maxDur = events.reduce((m, e) => Math.max(m, Number(e.durationMs ?? 0)), 0)
  const ptsDur = maxDur > 5000 ? 15 : 0
  const ptsAlertas = events.length > 3 ? 15 : 0
  return Math.min(100, pts + ptsDur + ptsAlertas)
}

export const getHoraDeEvento = (e) => {
  const iso = e.time || e.fechaEventoISO || e.createdAt
  if (!iso) return null
  const d = new Date(iso)
  return isNaN(d.getTime()) ? null : d.getHours()
}

export const getFechaHoy = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const buildConductorMap = (trips = [], events = []) => {
  const map = new Map()
  ;[...trips, ...events].forEach((r) => {
    const id = getDriverId(r)
    if (!map.has(id)) map.set(id, getDriverInfo(r))
  })
  return map
}

export const countEventsByType = (events = []) => ({
  cabezaAbajo: events.filter((e) => e.type === 'Cabeza abajo' || e.tipoEvento === 'Cabeza abajo').length,
  cabezaArriba: events.filter((e) => e.type === 'Cabeza arriba' || e.tipoEvento === 'Cabeza arriba').length,
  rostroPerdido: events.filter((e) => e.type === 'Rostro perdido' || e.tipoEvento === 'Rostro perdido').length,
  narizNoDetectada: events.filter((e) => e.type === 'Nariz no detectada' || e.tipoEvento === 'Nariz no detectada').length,
  somnolenciaProgresiva: events.filter((e) =>
    (e.type || e.tipoEvento || '').toLowerCase().includes('somnolencia'),
  ).length,
})

export const buildHourDistribution = (events = []) => {
  const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }))
  for (const e of events) {
    const h = getHoraDeEvento(e)
    if (h !== null) hours[h].count++
  }
  return hours
}
