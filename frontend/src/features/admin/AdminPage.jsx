import { useCallback, useEffect, useRef, useState } from 'react'
import { obtenerConductoresAdmin, obtenerResumenConductorAdmin } from '../../services/adminService'
import { suscribirMonitoreoAdmin } from '../../services/supabaseRealtimeService'
import AdminDriverPanel from './AdminDriverPanel'
import AdminEmployeeSelector from './AdminEmployeeSelector'
import AnalyticsDashboard from './AnalyticsDashboard'
import DispatchPlanner from './DispatchPlanner'

const TABS = [
  { id: 'panel', label: 'Panel' },
  { id: 'analytics', label: 'Análisis' },
  { id: 'planner', label: 'Planeación' },
]

function AdminPage({ onBackToApp }) {
  const [conductores, setConductores] = useState([])
  const [driverIdSeleccionado, setDriverIdSeleccionado] = useState('')
  const [resumen, setResumen] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('Panel listo para recibir datos.')
  const [tabActiva, setTabActiva] = useState('panel')
  const refrescoRealtimeRef = useRef(null)

  const cargarConductores = useCallback(async () => {
    setCargando(true)
    const respuesta = await obtenerConductoresAdmin()
    if (respuesta.ok) {
      setConductores(respuesta.data)
      setMensaje(
        respuesta.data.length
          ? 'Conductores cargados desde API local.'
          : 'No hay conductores con eventos todavia.',
      )
    } else {
      setMensaje(`API local no disponible: ${respuesta.error?.message || 'sin detalle'}`)
    }
    setCargando(false)
  }, [])

  const cargarResumen = useCallback(async (driverId) => {
    if (!driverId) {
      setResumen(null)
      return
    }
    setCargando(true)
    const respuesta = await obtenerResumenConductorAdmin(driverId)
    if (respuesta.ok) {
      setResumen(respuesta.data)
      setMensaje('Panel actualizado con datos del empleado.')
    } else {
      setMensaje(`No se pudo cargar el panel del empleado: ${respuesta.error?.message || 'sin detalle'}`)
    }
    setCargando(false)
  }, [])

  const programarRefresco = useCallback(() => {
    window.clearTimeout(refrescoRealtimeRef.current)
    refrescoRealtimeRef.current = window.setTimeout(() => {
      cargarConductores()
      if (driverIdSeleccionado) cargarResumen(driverIdSeleccionado)
    }, 450)
  }, [cargarConductores, cargarResumen, driverIdSeleccionado])

  useEffect(() => {
    const id = window.setTimeout(cargarConductores, 0)
    return () => window.clearTimeout(id)
  }, [cargarConductores])

  useEffect(() => {
    const id = window.setTimeout(() => cargarResumen(driverIdSeleccionado), 0)
    return () => window.clearTimeout(id)
  }, [cargarResumen, driverIdSeleccionado])

  useEffect(() => {
    const cancelar = suscribirMonitoreoAdmin({
      driverId: driverIdSeleccionado,
      onEvento: programarRefresco,
      onViaje: programarRefresco,
      onEstado: setMensaje,
    })
    return () => {
      cancelar()
      window.clearTimeout(refrescoRealtimeRef.current)
    }
  }, [driverIdSeleccionado, programarRefresco])

  const seleccionarConductorDesdeDashboard = useCallback((id) => {
    setDriverIdSeleccionado(id)
    setTabActiva('panel')
  }, [])

  return (
    <main className="admin-screen">
      <header className="admin-header">
        <div>
          <span className="admin-label">MicroSueno AI Empresas</span>
          <h1>Panel de administrador</h1>
          <p>Supervision de conductores, alertas y estadisticas operativas.</p>
        </div>
        <button type="button" onClick={onBackToApp}>Volver a app</button>
      </header>

      <nav className="admin-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`admin-tab${tabActiva === tab.id ? ' admin-tab--active' : ''}`}
            onClick={() => setTabActiva(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {tabActiva === 'panel' && (
        <section className="admin-layout">
          <aside className="admin-sidebar">
            <AdminEmployeeSelector
              conductores={conductores}
              conductorSeleccionado={driverIdSeleccionado}
              cargando={cargando}
              onSeleccionar={setDriverIdSeleccionado}
              onRefrescar={cargarConductores}
            />
            <section className="admin-card admin-realtime">
              <span className="admin-label">Realtime</span>
              <p>{mensaje}</p>
              <small>Preparado para escuchar cambios en Supabase `trips` y `events`.</small>
            </section>
          </aside>
          <AdminDriverPanel resumen={resumen} />
        </section>
      )}

      {tabActiva === 'analytics' && (
        <AnalyticsDashboard
          driverId={driverIdSeleccionado}
          onSeleccionarConductor={seleccionarConductorDesdeDashboard}
        />
      )}

      {tabActiva === 'planner' && (
        <DispatchPlanner />
      )}
    </main>
  )
}

export default AdminPage
