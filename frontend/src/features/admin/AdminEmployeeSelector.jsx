function AdminEmployeeSelector({ conductores, conductorSeleccionado, cargando, onSeleccionar, onRefrescar }) {
  return (
    <section className="admin-card admin-selector">
      <div>
        <span className="admin-label">Empleado supervisado</span>
        <h2>Selecciona conductor</h2>
      </div>

      <label>
        <span>Conductor</span>
        <select
          value={conductorSeleccionado || ''}
          onChange={(event) => onSeleccionar(event.target.value)}
          disabled={cargando || conductores.length === 0}
        >
          <option value="">Seleccionar empleado</option>
          {conductores.map((conductor) => (
            <option key={conductor.driverId} value={conductor.driverId}>
              {conductor.driverName} {conductor.driverEmail ? `- ${conductor.driverEmail}` : ''}
            </option>
          ))}
        </select>
      </label>

      <button type="button" className="admin-secondary" onClick={onRefrescar} disabled={cargando}>
        Actualizar datos
      </button>
    </section>
  )
}

export default AdminEmployeeSelector
