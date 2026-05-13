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

function ControlRutaPlanificada({ rutaPlanificada, origenRuta, destinoRuta, centrarRutaToken }) {
  const mapa = useMap()
  const tokenAplicadoRef = useRef(0)

  useEffect(() => {
    if (!centrarRutaToken || tokenAplicadoRef.current === centrarRutaToken) return

    const puntos = [origenRuta, destinoRuta, ...rutaPlanificada]
      .filter(Boolean)
      .map((punto) => [punto.latitud, punto.longitud])

    if (puntos.length < 2) return
    mapa.fitBounds(puntos, { padding: [32, 32], maxZoom: 16, animate: true })
    tokenAplicadoRef.current = centrarRutaToken
  }, [centrarRutaToken, destinoRuta, mapa, origenRuta, rutaPlanificada])

  return null
}

function MapView({
  ubicacionActual,
  rutaRecorrida,
  eventos,
  centrarMapaToken,
  origenRuta,
  destinoRuta,
  rutaPlanificada = [],
  centrarRutaToken,
}) {
  const centro = ubicacionActual
    ? [ubicacionActual.latitud, ubicacionActual.longitud]
    : MAP.CENTRO_INICIAL
  const ruta = rutaRecorrida.map((punto) => [punto.latitud, punto.longitud])
  const rutaUber = rutaPlanificada.map((punto) => [punto.latitud, punto.longitud])
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
      <ControlRutaPlanificada
        origenRuta={origenRuta}
        destinoRuta={destinoRuta}
        rutaPlanificada={rutaPlanificada}
        centrarRutaToken={centrarRutaToken}
      />

      {rutaUber.length > 1 && (
        <Polyline
          positions={rutaUber}
          pathOptions={{ color: '#2563eb', weight: 7, opacity: 0.82 }}
        />
      )}

      {ruta.length > 1 && <Polyline positions={ruta} pathOptions={{ color: '#0f766e', weight: 5 }} />}

      {origenRuta && (
        <CircleMarker
          center={[origenRuta.latitud, origenRuta.longitud]}
          pathOptions={{ color: '#047857', fillColor: '#22c55e', fillOpacity: 0.9, weight: 3 }}
          radius={9}
        >
          <Popup>
            <strong>Inicio</strong>
            <br />
            {origenRuta.etiqueta}
          </Popup>
        </CircleMarker>
      )}

      {destinoRuta && (
        <CircleMarker
          center={[destinoRuta.latitud, destinoRuta.longitud]}
          pathOptions={{ color: '#991b1b', fillColor: '#ef4444', fillOpacity: 0.9, weight: 3 }}
          radius={10}
        >
          <Popup>
            <strong>Destino</strong>
            <br />
            {destinoRuta.etiqueta}
          </Popup>
        </CircleMarker>
      )}

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
            Hora: {evento.fechaHoraEvento || evento.horaEvento}
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