import { formatoDuracionEvento, formatoNumero } from '../utils/formatters'

function MetricsPanel({ detectorListo, tipoActual, deltaY, desplazamientoAbsoluto, tiempoEventoActual, posicionNarizY }) {
  const estadoDetector = detectorListo ? 'MediaPipe listo' : 'MediaPipe pendiente'

  return (
    <section className="metricas">
      <article className="tarjeta metrica">
        <span>Estado camara</span>
        <strong>{estadoDetector}</strong>
      </article>
      <article className="tarjeta metrica">
        <span>Tipo actual</span>
        <strong>{tipoActual}</strong>
      </article>
      <article className="tarjeta metrica">
        <span>deltaY firmado</span>
        <strong>{formatoNumero(deltaY)} px</strong>
      </article>
      <article className="tarjeta metrica">
        <span>Desplazamiento absoluto</span>
        <strong>{formatoNumero(desplazamientoAbsoluto)} px</strong>
      </article>
      <article className="tarjeta metrica">
        <span>Tiempo evento actual</span>
        <strong>{formatoDuracionEvento(tiempoEventoActual)}</strong>
      </article>
      <article className="tarjeta metrica">
        <span>Posicion Y nariz</span>
        <strong>{formatoNumero(posicionNarizY)} px</strong>
      </article>
    </section>
  )
}

export default MetricsPanel
