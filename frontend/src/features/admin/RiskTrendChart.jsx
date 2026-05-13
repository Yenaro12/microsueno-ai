import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend)

function RiskTrendChart({ trend = [], titulo = 'Tendencia de riesgo por viaje' }) {
  if (!trend || trend.length < 2) {
    return (
      <article className="analytics-chart-card">
        <span className="analytics-chart-title">{titulo}</span>
        <div className="analytics-chart-empty">Se necesitan al menos 2 viajes finalizados</div>
      </article>
    )
  }

  const labels = trend.map((t, i) => {
    if (!t.fecha) return `Viaje ${i + 1}`
    const d = new Date(t.fecha)
    return `${d.getDate()}/${d.getMonth() + 1}`
  })

  const data = {
    labels,
    datasets: [
      {
        label: 'Índice de riesgo',
        data: trend.map((t) => t.indiceRiesgo ?? 0),
        borderColor: 'rgba(15, 23, 42, 0.9)',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: trend.map((t) => {
          const v = t.indiceRiesgo ?? 0
          if (v >= 70) return '#0f172a'
          if (v >= 40) return '#1e40af'
          return '#3b82f6'
        }),
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` Probabilidad: ${ctx.raw}%`,
          afterLabel: (ctx) => {
            const t = trend[ctx.dataIndex]
            return [`Eventos: ${t.totalEventos ?? 0}`, `Km: ${t.km ?? 0}`]
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(15, 23, 42, 0.05)' },
        ticks: { color: '#64748b', font: { size: 11 } },
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(15, 23, 42, 0.05)' },
        ticks: { color: '#64748b', font: { size: 11 }, callback: (v) => `${v}` },
      },
    },
  }

  return (
    <article className="analytics-chart-card">
      <span className="analytics-chart-title">{titulo}</span>
      <div className="analytics-chart-container" style={{ height: 220 }}>
        <Line data={data} options={options} />
      </div>
    </article>
  )
}

export default RiskTrendChart
