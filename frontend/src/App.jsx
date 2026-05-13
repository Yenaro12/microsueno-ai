import LandingPage from './features/landing/LandingPage'
import AdminPage from './features/admin/AdminPage'
import AuthenticatedApp from './features/driver/AuthenticatedApp'
import { useAuth } from './hooks/useAuth'

function App() {
  const auth = useAuth()

  if (!auth.autenticado) {
    return <LandingPage onLoginAs={auth.loginAsRole} />
  }

  // Si es manager o director, va al AdminPage
  if (auth.role === 'manager' || auth.role === 'director') {
    return <AdminPage onBackToApp={auth.cerrarSesion} />
  }

  // Por defecto (driver) va a la app de detección
  return <AuthenticatedApp auth={auth} />
}

export default App
