const objectUrlsTemporales = new Set()
const canvasTemporales = new Set()
const PREFIJO_SESSION_TEMPORAL = 'microsueno-temp-'

export function registrarObjectUrlTemporal(url) {
  if (url) objectUrlsTemporales.add(url)
  return url
}

export function revocarObjectUrlTemporal(url) {
  if (!url || !objectUrlsTemporales.has(url)) return false
  URL.revokeObjectURL(url)
  objectUrlsTemporales.delete(url)
  return true
}

export function registrarCanvasTemporal(canvas) {
  if (canvas) canvasTemporales.add(canvas)
  return canvas
}

export function limpiarCanvasTemporal(canvas) {
  const contexto = canvas?.getContext?.('2d')
  if (!canvas || !contexto) return false
  contexto.clearRect(0, 0, canvas.width, canvas.height)
  return true
}

export function limpiarSessionStorageTemporal() {
  if (typeof sessionStorage === 'undefined') return 0

  const clavesTemporales = []
  for (let indice = 0; indice < sessionStorage.length; indice += 1) {
    const clave = sessionStorage.key(indice)
    if (clave?.startsWith(PREFIJO_SESSION_TEMPORAL)) clavesTemporales.push(clave)
  }

  clavesTemporales.forEach((clave) => sessionStorage.removeItem(clave))
  return clavesTemporales.length
}

export function limpiarCacheTemporal({ canvasRef } = {}) {
  let objectUrlsRevocados = 0
  let canvasLiberados = 0

  objectUrlsTemporales.forEach((url) => {
    URL.revokeObjectURL(url)
    objectUrlsRevocados += 1
  })
  objectUrlsTemporales.clear()

  if (limpiarCanvasTemporal(canvasRef?.current)) canvasLiberados += 1

  canvasTemporales.forEach((canvas) => {
    if (limpiarCanvasTemporal(canvas)) canvasLiberados += 1
  })
  canvasTemporales.clear()

  return {
    objectUrlsRevocados,
    canvasLiberados,
    clavesSessionEliminadas: limpiarSessionStorageTemporal(),
    fechaISO: new Date().toISOString(),
  }
}