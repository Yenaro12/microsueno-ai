import React from 'react'
import './LandingPage.css'

function LandingPage({ onLoginAs }) {
  return (
    <div className="landing-container">
      <header className="landing-header">
        <div className="logo">MicroSueno<span>AI</span></div>
        <nav>
          <a href="#features">Tecnología</a>
          <a href="#about">Empresa</a>
          <button className="btn-outline">Contacto</button>
        </nav>
      </header>

      <main className="landing-hero">
        <h1>Seguridad Logística Impulsada por <span>Inteligencia Artificial</span></h1>
        <p>Monitoreo predictivo de fatiga, optimización de rutas y gestión de flotas de alta gama en tiempo real.</p>
        
        <div className="login-options">
          <h2>Acceso al Sistema</h2>
          <div className="grid-options">
            <article className="option-card" onClick={() => onLoginAs('driver')}>
              <div className="icon">🚚</div>
              <h3>Conductor</h3>
              <p>Detección de fatiga y navegación segura.</p>
              <button className="btn-primary">Entrar</button>
            </article>

            <article className="option-card" onClick={() => onLoginAs('manager')}>
              <div className="icon">📊</div>
              <h3>Fleet Manager</h3>
              <p>Control de flotas, alertas y planeación.</p>
              <button className="btn-primary">Gestionar</button>
            </article>

            <article className="option-card" onClick={() => onLoginAs('director')}>
              <div className="icon">🏛️</div>
              <h3>Director Ops</h3>
              <p>Visión global y rentabilidad corporativa.</p>
              <button className="btn-primary">Reportes</button>
            </article>
          </div>
        </div>
      </main>

      <footer className="landing-footer">
        <p>&copy; 2026 MicroSueno AI. Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}

export default LandingPage
