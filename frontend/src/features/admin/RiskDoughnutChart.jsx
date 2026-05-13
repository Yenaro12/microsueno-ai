import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

function RiskDoughnutChart({ byType = null, titulo = 'Distribución de niveles de riesgo' }) {
  // Recibimos eventos por nivel desde byType o lo calculamos desde stats
  const bajo = byType?.bajo ?? 0
  const medio = byType?.medio ?? 0
  const alto = byType?.alto ?? 0
  const alarma = byType?.alarma ?? 0
  const total = bajo + medio + alto + alarma

  if (total === 0) {
    return (
      <article className="analytics-chart-card">
        <span className="analytics-chart-title">{titulo}</span>
        <div className="analytics-chart-empty">Sin datos de niveles</div>
      </article>
    )
  }

  const data = {
    labels: ['Bajo', 'Medio', 'Alto', 'Alarma'],
    datasets: [
      {
        data: [bajo, medio, alto, alarma],
        backgroundColor: [
          'rgba(147, 197, 253, 0.85)', /* Azul claro */
          'rgba(59, 130, 246, 0.85)', /* Azul base */
          'rgba(30, 64, 175, 0.85)', /* Azul oscuro */
          'rgba(15, 23, 42, 0.85)', /* Negro/Azul muy oscuro */
        ],
        borderColor: [
          'rgba(147, 197, 253, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(30, 64, 175, 1)',
          'rgba(15, 23, 42, 1)',
        ],
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#000000',
          font: { size: 12 },
          padding: 16,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const pct = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : 0
            return ` ${ctx.raw} eventos (${pct}%)`
          },
        },
      },
    },
  }

  return (
    <article className="analytics-chart-card">
      <span className="analytics-chart-title">{titulo}</span>
      <div className="analytics-chart-container" style={{ height: 260 }}>
        <Doughnut data={data} options={options} />
      </div>
    </article>
  )
}

export default RiskDoughnutChart
