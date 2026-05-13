function UserProfile({ usuario, onBack, onOpenTechnical, onLogout }) {
  return (
    <main className="profile-screen">
      <section className="profile-card">
        <div>
          <span className="profile-label">Perfil del conductor</span>
          <h1>{usuario?.nombre || 'Conductor'}</h1>
          <p>{usuario?.correo || 'sin correo registrado'}</p>
        </div>

        <div className="profile-data">
          <div>
            <span>Estado de sesion</span>
            <strong>Activa</strong>
          </div>
          <div>
            <span>Rol</span>
            <strong>Operador de transporte</strong>
          </div>
        </div>

        <div className="profile-actions">
          <button type="button" className="auth-primary" onClick={onBack}>Volver al mapa</button>
          <button type="button" className="profile-secondary" onClick={onOpenTechnical}>Panel tecnico</button>
          <button type="button" className="profile-danger" onClick={onLogout}>Cerrar sesion</button>
        </div>
      </section>
    </main>
  )
}

export default UserProfile