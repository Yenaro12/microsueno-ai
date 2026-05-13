import { formatoDuracionEvento, formatoNumero, formatoTiempo } from '../utils/formatters'
import { claseIndiceRiesgo } from '../utils/riskCalculator'

function TripAnalysis({ analisisViaje }) {
  const claseIndice = claseIndiceRiesgo(analisisViaje.indiceRiesgo)

  return (
    <section className="tarjeta analisis-datos">
      <div className="titulo-panel">
        <div>
          <h2>Analisis del viaje</h2>
          <span>Indice de riesgo del viaje: {analisisViaje.indiceRiesgo}/100</span>
        </div>
        <strong className={`nivel-indice ${claseIndice}`}>{analisisViaje.clasificacion}</strong>
      </div>

      <div className="resumen-analitico">
        <div>
          <span>Duracion del viaje</span>
          <strong>{formatoTiempo(analisisViaje.duracionViajeMs)}</strong>
        </div>
        <div>
          <span>Total de eventos</span>
          <strong>{analisisViaje.totalEventos}</strong>
        </div>
        <div>
          <span>Cabeza abajo</span>
          <strong>{analisisViaje.eventosCabezaAbajo}</strong>
        </div>
        <div>
          <span>Cabeza arriba</span>
          <strong>{analisisViaje.eventosCabezaArriba}</strong>
        </div>
        <div>
          <span>Rostro perdido</span>
          <strong>{analisisViaje.eventosRostroPerdido}</strong>
        </div>
        <div>
          <span>Nariz no detectada</span>
          <strong>{analisisViaje.eventosNarizNoDetectada}</strong>
        </div>
        <div>
          <span>Duracion maxima</span>
          <strong>{formatoDuracionEvento(analisisViaje.duracionMaxima)}</strong>
        </div>
        <div>
          <span>Duracion promedio</span>
          <strong>{formatoDuracionEvento(analisisViaje.duracionPromedio)}</strong>
        </div>
        <div>
          <span>Km recorridos</span>
          <strong>{formatoNumero(analisisViaje.kilometros, 2)}</strong>
        </div>
        <div>
          <span>Alertas por km</span>
          <strong>{formatoNumero(analisisViaje.alertasPorKm, 2)}</strong>
        </div>
      </div>

      <p className="recomendacion">{analisisViaje.recomendacion}</p>
    </section>
  )
}

export default TripAnalysis
