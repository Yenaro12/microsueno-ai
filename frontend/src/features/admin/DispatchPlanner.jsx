import React, { useEffect, useState } from 'react'
import { getFleetOptimization } from '../../services/analyticsService'

function DispatchPlanner() {
  const [data, setData] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function loadData() {
      setCargando(true)
      const res = await getFleetOptimization()
      if (res.ok) {
        setData(res.data?.data || res.data)
      }
      setCargando(false)
    }
    loadData()
  }, [])

  if (cargando) {
    return (
      <div className="analytics-view">
        <div className="analytics-section-header">
          <h2>Planeación y Despacho Inteligente</h2>
          <p>Cargando algoritmos predictivos...</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '32px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: '140px', background: '#f1f5f9', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
        <div style={{ height: '300px', background: '#f1f5f9', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
        <style>{`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}</style>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="analytics-view">
        <div className="analytics-section-header">
          <h2>Planeación y Despacho Inteligente</h2>
          <p style={{color: 'red'}}>Error de conexión con el motor de optimización (Asegúrese de reiniciar el servidor backend para aplicar los nuevos endpoints).</p>
        </div>
      </div>
    )
  }

  const { conductores, optimizaciones } = data

  return (
    <div className="analytics-view">
      <div className="analytics-section-header">
        <h2>Planeación y Despacho Inteligente</h2>
        <p>Asignación de rutas basada en Eco-Safety Score y rango seguro predictivo.</p>
      </div>

      {/* Viajes Pendientes / Combos */}
      <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', color: '#0f172a' }}>Rutas Pendientes (Sugerencia de IA)</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '32px' }}>
        {optimizaciones.map((trip) => (
          <article key={trip.id} className="analytics-chart-card" style={{ padding: '20px', borderLeft: trip.tipoAsignacion.includes('Combo') ? '4px solid #2563eb' : '4px solid #1e40af' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>{trip.origin} ➔ {trip.dest}</h4>
                <div style={{ color: '#1e40af', fontSize: '0.85rem', fontWeight: 'bold', marginTop: '4px' }}>
                  Distancia: {trip.distanceKm} km | Urgencia: {trip.urgency}
                </div>
              </div>
              <span style={{ 
                background: trip.tipoAsignacion.includes('Combo') ? '#e0e7ff' : '#f0f8ff', 
                color: trip.tipoAsignacion.includes('Combo') ? '#2563eb' : '#0f172a',
                padding: '4px 12px', 
                borderRadius: '16px', 
                fontSize: '0.75rem', 
                fontWeight: 'bold' 
              }}>
                {trip.tipoAsignacion}
              </span>
            </div>

            <p style={{ margin: '12px 0', fontSize: '0.85rem', color: '#000000' }}>
              {trip.mensaje}
            </p>

            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <strong style={{ fontSize: '0.75rem', color: '#1e40af', textTransform: 'uppercase' }}>Conductores Asignados:</strong>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                {trip.recomendados.map(c => (
                  <div key={c.driverId} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', padding: '6px 12px', borderRadius: '4px', border: '1px solid #bfdbfe', fontSize: '0.85rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }} />
                    <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{c.driverName}</span>
                    <span style={{ color: '#1e40af', fontSize: '0.75rem' }}>({c.rangoOptimoKm} km seguros)</span>
                  </div>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Disponibilidad (Banquillo) */}
      <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', color: '#0f172a' }}>Disponibilidad de Flota (Ranking Seguro)</h3>
      <article className="analytics-chart-card">
        <table className="analytics-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Conductor</th>
              <th style={{ textAlign: 'right', padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Eco-Safety Score</th>
              <th style={{ textAlign: 'right', padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Alcance Seguro (Predictivo)</th>
              <th style={{ textAlign: 'center', padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {conductores.map(c => (
              <tr key={c.driverId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{c.driverName}</td>
                <td style={{ padding: '12px', textAlign: 'right', color: c.ecoSafetyScore > 80 ? '#2563eb' : '#0f172a' }}>{c.ecoSafetyScore}%</td>
                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>{c.rangoOptimoKm} km</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    Disponible
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>

    </div>
  )
}

export default DispatchPlanner
