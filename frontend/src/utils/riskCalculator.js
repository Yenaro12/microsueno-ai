import { EVENT_TYPES, RISK_LEVELS } from './constants'

export const calcularIndiceRiesgo = (eventos = []) => {
  const puntosEventos = eventos.reduce((total, evento) => {
    let puntos = total
    if (evento.nivel === RISK_LEVELS.MEDIO) puntos += 5
    if (evento.nivel === RISK_LEVELS.ALTO) puntos += 10
    if (evento.nivel === RISK_LEVELS.ALARMA) puntos += 20
    if (evento.tipoEvento === EVENT_TYPES.ROSTRO_PERDIDO) puntos += 15
    if (evento.tipoEvento === EVENT_TYPES.NARIZ_NO_DETECTADA) puntos += 15
    return puntos
  }, 0)

  const duracionMaxima = eventos.reduce(
    (maximo, evento) => Math.max(maximo, evento.duracionMs || 0),
    0,
  )
  const puntosDuracion = duracionMaxima > 5000 ? 15 : 0
  const puntosAlertas = eventos.length > 3 ? 15 : 0
  return Math.min(100, puntosEventos + puntosDuracion + puntosAlertas)
}

export const clasificarRiesgo = (indiceRiesgo) => {
  if (indiceRiesgo <= 30) return 'Riesgo bajo'
  if (indiceRiesgo <= 60) return 'Riesgo medio'
  return 'Riesgo alto'
}

export const claseIndiceRiesgo = (indiceRiesgo) => {
  if (indiceRiesgo <= 30) return 'bajo'
  if (indiceRiesgo <= 60) return 'medio'
  return 'alto'
}

export const obtenerRecomendacion = (indiceRiesgo) => {
  if (indiceRiesgo <= 30) return 'Viaje estable, sin patrones criticos detectados.'
  if (indiceRiesgo <= 60) {
    return 'Se detectaron senales moderadas de fatiga. Se recomienda precaucion.'
  }
  return 'Se detectaron patrones criticos. Se recomienda detenerse en un lugar seguro y descansar.'
}
