import LoginView from './components/LoginView'
import RegisterView from './components/RegisterView'
import AdminPage from './features/admin/AdminPage'
import AuthenticatedApp from './features/driver/AuthenticatedApp'
import { useAppRoute } from './hooks/useAppRoute'
import { useAuth } from './hooks/useAuth'

function App() {
  const auth = useAuth()
  const navegacion = useAppRoute()

  if (navegacion.esAdmin) {
    return <AdminPage onBackToApp={() => navegacion.navegar('/')} />
  }

  if (!auth.autenticado) {
    return navegacion.ruta === '/registro' ? (
      <RegisterView onRegister={auth.registrarUsuario} onGoLogin={() => navegacion.navegar('/')} />
    ) : (
      <LoginView onLogin={auth.iniciarSesion} onGoRegister={() => navegacion.navegar('/registro')} />
    )
  }

  return <AuthenticatedApp auth={auth} />
}

export default App
