function DetectionService({
  videoRef,
  canvasRef,
  visible,
  camaraActiva,
  estadoRiesgo,
  tipoActual,
  puntajeRiesgo,
  calibrandoReferencia,
}) {
  return (
    <aside
      className={`servicio-deteccion ${visible ? 'mini' : 'oculto'} riesgo-${estadoRiesgo}`}
      aria-label="Mini camara de monitoreo del conductor"
      aria-hidden={!visible}
    >
      <div className="mini-camara-encabezado">
        <span>{camaraActiva ? (calibrandoReferencia ? 'Calibrando' : 'Conductor') : 'Camara'}</span>
        <strong>{Math.round(puntajeRiesgo || 0)}/100</strong>
      </div>
      <div className="mini-camara-video">
        <video ref={videoRef} playsInline muted />
        <canvas ref={canvasRef} />
        {!camaraActiva && <small>Inicia viaje</small>}
      </div>
      <div className="mini-camara-pie">{tipoActual || 'Listo'}</div>
    </aside>
  )
}

export default DetectionService
