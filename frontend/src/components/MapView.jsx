import { useEffect, useRef } from 'react'
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import { MAP } from '../utils/constants'
import { formatoDuracionEvento, formatoNumero } from '../utils/formatters'

function ControlCentrado({ ubicacionActual, centrarMapaToken }) {
  const mapa = useMap()
  const centroInicialAplicadoRef = useRef(false)

  useEffect(() => {
    if (!ubicacionActual) return
    if (centroInicialAplicadoRef.current && !centrarMapaToken) return
    mapa.setView([ubicacionActual.latitud, ubicacionActual.longitud], 16, { animate: true })
    centroInicialAplicadoRef.current = true
  }, [centrarMapaToken, mapa, ubicacionActual])

  return null
}

function MapView({ ubicacionActual, rutaRecorrida, eventos, centrarMapaToken }) {
  const centro = ubicacionActual
    ? [ubicacionActual.latitud, ubicacionActual.longitud]
    : MAP.CENTRO_INICIAL
  const ruta = rutaRecorrida.map((punto) => [punto.latitud, punto.longitud])
  const eventosConUbicacion = eventos.filter(
    (evento) => Number.isFinite(evento.latitud) && Number.isFinite(evento.longitud),
  )

  return (
    <MapContainer center={centro} zoom={14} scrollWheelZoom className="mapa-ruta">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ControlCentrado ubicacionActual={ubicacionActual} centrarMapaToken={centrarMapaToken} />
      {ruta.length > 1 && <Polyline positions={ruta} pathOptions={{ color: '#0f766e', weight: 5 }} />}
      {ubicacionActual && (
        <CircleMarker
          center={[ubicacionActual.latitud, ubicacionActual.longitud]}
          pathOptions={{ color: '#0284c7', fillColor: '#38bdf8', fillOpacity: 0.82, weight: 3 }}
          radius={9}
        >
          <Popup>Ubicacion actual</Popup>
        </CircleMarker>
      )}
      {eventosConUbicacion.map((evento) => (
        <CircleMarker
          key={evento.id}
          center={[evento.latitud, evento.longitud]}
          pathOptions={{
            color: evento.nivel === 'alarma' ? '#991b1b' : '#b45309',
            fillColor: evento.nivel === 'alarma' ? '#ef4444' : '#f59e0b',
            fillOpacity: 0.86,
            weight: 3,
          }}
          radius={evento.nivel === 'alarma' ? 10 : 8}
        >
          <Popup>
            <strong>{evento.tipoEvento}</strong>
            <br />
            Hora: {evento.horaEvento}
            <br />
            Riesgo: {evento.nivel}
            <br />
            Duracion: {formatoDuracionEvento(evento.duracionMs)}
            <br />
            Desplazamiento: {formatoNumero(evento.desplazamiento, 1)} px
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}

export default MapView
