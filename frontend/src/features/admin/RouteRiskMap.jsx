import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Corrección para los iconos de leaflet en react
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Icono personalizado para alarmas
const alarmIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-black.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

function RouteRiskMap({ geoData }) {
  if (!geoData || geoData.length === 0) {
    return (
      <article className="analytics-chart-card">
        <span className="analytics-chart-title">Mapa de Riesgo en Rutas (Zonas Calientes)</span>
        <div className="analytics-chart-empty">Sin eventos geolocalizados disponibles.</div>
      </article>
    )
  }

  // Calculamos el centro basado en los datos
  const lats = geoData.map(d => d.lat)
  const lngs = geoData.map(d => d.lng)
  const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2
  const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2

  return (
    <article className="analytics-chart-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="analytics-chart-title">Mapa de Riesgo Logístico (Zonas Calientes)</span>
        <span style={{ fontSize: '0.75rem', color: '#1e40af' }}>{geoData.length} alertas en ruta</span>
      </div>

      <div style={{ 
        position: 'relative', 
        height: '300px', 
        borderRadius: '8px', 
        overflow: 'hidden',
        border: '1px solid #bfdbfe',
        zIndex: 1
      }}>
        <MapContainer center={[centerLat, centerLng]} zoom={6} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          {geoData.map((punto) => (
            <Marker 
              key={punto.id} 
              position={[punto.lat, punto.lng]} 
              icon={punto.level === 'alarma' ? alarmIcon : new L.Icon.Default()}
            >
              <Popup>
                <strong>{punto.driverName}</strong><br />
                {punto.type} ({punto.level})
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </article>
  )
}

export default RouteRiskMap
