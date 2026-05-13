function ConnectionStatus({ conectado }) {
  return (
    <span className={`connection-status ${conectado ? 'online' : 'offline'}`}>
      <i aria-hidden="true" />
      {conectado ? 'Conectado' : 'Sin conexion'}
    </span>
  )
}

export default ConnectionStatus