export const formatoNumero = (valor, decimales = 1) =>
  Number.isFinite(valor) ? Number(valor).toFixed(decimales) : '--'

export const formatoTiempo = (milisegundos) => {
  const totalSegundos = Math.max(0, Math.floor((milisegundos || 0) / 1000))
  const minutos = Math.floor(totalSegundos / 60)
  const segundos = totalSegundos % 60
  return `${minutos}:${String(segundos).padStart(2, '0')}`
}

export const formatoDuracionEvento = (milisegundos) =>
  `${((milisegundos || 0) / 1000).toFixed(1)} s`

export const formatoHora = (fecha = new Date()) =>
  fecha.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

export const crearId = (prefijo = 'id') =>
  `${prefijo}-${Date.now()}-${Math.random().toString(16).slice(2)}`
