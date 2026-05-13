import { formatoNumero } from '../utils/formatters'

function RoutePlanner({
  origenTexto,
  destinoTexto,
  estadoRuta,
  mensajeRuta,
  resumenRuta,
  origenSugerido,
  onOrigenChange,
  onDestinoChange,
  onUsarUbicacionActual,
  onCalcularRuta,
  onLimpiarRuta,
}) {
  const calculando = estadoRuta === 'calculando'

  return (
    <form
      className="planificador-ruta"
      onSubmit={(evento) => {
        evento.preventDefault()
        onCalcularRuta()
      }}
    >
      <div className="campos-ruta">
        <label className="campo-ruta">
          <span>Punto de inicio</span>
          <input
            value={origenTexto}
            onChange={(evento) => onOrigenChange(evento.target.value)}
            placeholder={origenSugerido || '18.65288, -99.18417 o direccion'}
            inputMode="text"
          />
        </label>
        <label className="campo-ruta">
          <span>Punto de destino</span>
          <input
            value={destinoTexto}
            onChange={(evento) => onDestinoChange(evento.target.value)}
            placeholder="Destino o coordenadas lat,lng"
            inputMode="text"
          />
        </label>
      </div>

      <div className="acciones-ruta">
        <button className="boton secundario" type="button" onClick={onUsarUbicacionActual}>
          Usar mi ubicacion
        </button>
        <button className="boton primario" type="submit" disabled={calculando}>
          {calculando ? 'Calculando...' : 'Calcular ruta'}
        </button>
        <button className="boton peligro-suave" type="button" onClick={onLimpiarRuta}>
          Limpiar ruta
        </button>
      </div>

      <div className={`resumen-ruta ${estadoRuta}`}>
        <span>{mensajeRuta}</span>
        {resumenRuta && (
          <strong>
            {formatoNumero(resumenRuta.distanciaKm, 2)} km
            {resumenRuta.duracionMinutos > 0
              ? ` · ${formatoNumero(resumenRuta.duracionMinutos, 0)} min`
              : ''}
          </strong>
        )}
      </div>
    </form>
  )
}

export default RoutePlanner