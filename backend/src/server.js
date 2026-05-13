import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import adminRoutes from './routes/adminRoutes.js'
import analyticsRoutes from './routes/analyticsRoutes.js'
import eventRoutes from './routes/eventRoutes.js'
import tripRoutes from './routes/tripRoutes.js'

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/trips', tripRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/analytics', analyticsRoutes)

app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' })
})

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ error: 'Error interno del servidor' })
})

app.listen(PORT, () => {
  console.log(`MicroSueno AI API escuchando en http://localhost:${PORT}`)
})
