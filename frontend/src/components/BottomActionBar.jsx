import PanicButton from './PanicButton'

function BottomActionBar({ viajeActivo, camaraActiva, cargandoDetector, onIniciarViaje, onTerminarViaje, onPanic }) {
  const puedeIniciarOMonitorear = !cargandoDetector && (!viajeActivo || !camaraActiva)

  return (
    <footer className="bottom-action-bar" aria-label="Acciones principales del viaje">
      <button className="bottom-button start" type="button" onClick={onIniciarViaje} disabled={!puedeIniciarOMonitorear}>
        Iniciar viaje
      </button>
      <button className="bottom-button end" type="button" onClick={onTerminarViaje} disabled={!viajeActivo}>
        Terminar viaje
      </button>
      <PanicButton onPanic={onPanic} />
    </footer>
  )
}

export default BottomActionBar