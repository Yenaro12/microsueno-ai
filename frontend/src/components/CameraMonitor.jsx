function CameraMonitor({ videoRef, canvasRef, camaraActiva, alarmaActiva, textoEncuadre }) {
  return (
    <section className={`tarjeta camara-panel ${alarmaActiva ? 'alarma' : ''}`}>
      <div className="zona-video">
        <video
          ref={videoRef}
          className="video-camara espejo"
          playsInline
          muted
          aria-label="Video en vivo de la camara"
        />
        <canvas
          ref={canvasRef}
          className="lienzo-deteccion espejo"
          aria-label="Canvas con punto de nariz detectado"
        />
        {!camaraActiva && (
          <div className="cubierta-video">
            <strong>Camara inactiva</strong>
            <span>{textoEncuadre}</span>
          </div>
        )}
      </div>
    </section>
  )
}

export default CameraMonitor
