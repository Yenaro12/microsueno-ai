import { APP_NAME } from '../utils/constants'
import ConnectionStatus from './ConnectionStatus'
import LocationStatus from './LocationStatus'

function AppNavbar({ conectado, ubicacionActual, usuario, onAbrirRuta, onAbrirPerfil }) {
  return (
    <header className="app-navbar">
      <div className="navbar-brand">
        <strong>{APP_NAME}</strong>
        <span>Monitoreo GPS</span>
      </div>

      <div className="navbar-status">
        <ConnectionStatus conectado={conectado} />
        <LocationStatus ubicacionActual={ubicacionActual} />
      </div>

      <nav className="navbar-actions" aria-label="Navegacion principal">
        <button type="button" onClick={onAbrirRuta}>Ruta</button>
        <button type="button" onClick={onAbrirPerfil}>{usuario?.nombre || 'Perfil'}</button>
      </nav>
    </header>
  )
}

export default AppNavbar