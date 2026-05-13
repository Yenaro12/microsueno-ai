import { formatoNumero } from '../utils/formatters'

function LocationStatus({ ubicacionActual }) {
  if (!ubicacionActual) return <span className="location-status">Ubicacion pendiente</span>

  return (
    <span className="location-status">
      {formatoNumero(ubicacionActual.latitud, 5)}, {formatoNumero(ubicacionActual.longitud, 5)}
    </span>
  )
}

export default LocationStatus