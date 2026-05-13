import React from 'react'

function FinancialImpactChart({ financialData }) {
  if (!financialData) {
    return (
      <article className="analytics-chart-card">
        <span className="analytics-chart-title">Impacto Financiero del Riesgo</span>
        <div className="analytics-chart-empty">Cargando proyecciones financieras...</div>
      </article>
    )
  }

  const { costoEstimadoRiesgo, ecoSafetyScore, totalEventos } = financialData

  return (
    <article className="analytics-chart-card" style={{ gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="analytics-chart-title">Análisis Financiero de Riesgo (Logística)</span>
        <span style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: 'bold' }}>Basado en {totalEventos} eventos</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ padding: '16px', background: '#f0f8ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
          <div style={{ color: '#000000', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>
            Costo Operativo en Riesgo
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
            ${costoEstimadoRiesgo.toLocaleString()} <span style={{ fontSize: '1rem', color: '#1e40af' }}>USD</span>
          </div>
          <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: '#000000' }}>
            Estimación de impacto por demoras, desgaste y riesgo de siniestralidad.
          </p>
        </div>

        <div style={{ padding: '16px', background: '#f0f8ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
          <div style={{ color: '#000000', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>
            Eco-Safety Score
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: ecoSafetyScore >= 80 ? '#2563eb' : '#0f172a', lineHeight: 1 }}>
            {ecoSafetyScore}%
          </div>
          <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: '#000000' }}>
            Eficiencia operativa y conducción segura de la flota.
          </p>
          <div style={{ marginTop: '12px', background: '#e0e7ff', height: '6px', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ background: '#2563eb', height: '100%', width: `${ecoSafetyScore}%` }} />
          </div>
        </div>
      </div>
    </article>
  )
}

export default FinancialImpactChart
