const limpiarSegmento = (valor) =>
  String(valor || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const crearDriverId = (correo, nombre = 'conductor-demo') => {
  const base = limpiarSegmento(correo) || limpiarSegmento(nombre) || 'conductor-demo'
  return `driver-${base}`
}

export const normalizarConductor = (usuario = {}) => {
  const correo = String(usuario.correo || usuario.email || '').trim().toLowerCase()
  const nombre = String(usuario.nombre || usuario.name || correo.split('@')[0] || 'Conductor Demo').trim()
  const driverId = usuario.driverId || usuario.id || crearDriverId(correo, nombre)

  return {
    driverId,
    driverName: nombre,
    driverEmail: correo,
  }
}
