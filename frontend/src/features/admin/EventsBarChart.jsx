import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const COLORES = {
  cabezaAbajo: 'rgba(15, 23, 42, 0.85)',
  cabezaArriba: 'rgba(30, 64, 175, 0.85)',
  rostroPerdido: 'rgba(59, 130, 246, 0.85)',
  narizNoDetectada: 'rgba(147, 197, 253, 0.85)',
  somnolenciaProgresiva: 'rgba(0, 0, 0, 0.85)',
}

function EventsBarChart({ byType = null, titulo = 'Distribución de eventos' }) {
  if (!byType) return <div className="analytics-chart-empty">Sin datos</div>

  const labels = ['Cabeza abajo', 'Cabeza arriba', 'Rostro perdido', 'Nariz no detectada', 'Somnolencia']
  const valores = [
    byType.cabezaAbajo ?? 0,
    byType.cabezaArriba ?? 0,
    byType.rostroPerdido ?? 0,
    byType.narizNoDetectada ?? 0,
    byType.somnolenciaProgresiva ?? 0,
  ]

  const data = {
    labels,
    datasets: [
      {
        label: 'Eventos',
        data: valores,
        backgroundColor: Object.values(COLORES),
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: { callbacks: { label: (ctx) => ` ${ctx.raw} eventos` } },
    },
    scales: {
      x: {
        grid: { color: 'rgba(37, 99, 235, 0.05)' },
        ticks: { color: '#1e40af', font: { size: 12 } },
      },
      y: {
        grid: { display: false },
        ticks: { color: '#000000', font: { size: 12 } },
      },
    },
  }

  return (
    <article className="analytics-chart-card">
      <span className="analytics-chart-title">{titulo}</span>
      <div className="analytics-chart-container" style={{ height: 220 }}>
        <Bar data={data} options={options} />
      </div>
    </article>
  )
}

export default EventsBarChart
