import AppNavbar from '../../components/AppNavbar'
import BottomActionBar from '../../components/BottomActionBar'
import MapView from '../../components/MapView'
import RouteModal from '../../components/RouteModal'

function DriverMapScreen({
  conexion,
  geolocalizacion,
  ruta,
  usuario,
  mensajeSistema,
  deteccion,
  viaje,
  rutaAbierta,
  onAbrirRuta,
  onCerrarRuta,
  onAbrirPerfil,
  onIniciarViaje,
  onTerminarViaje,
  onPanic,
}) {
  return (
    <main className="driver-app">
      <AppNavbar
        conectado={conexion.conectado}
        ubicacionActual={geolocalizacion.ubicacionActual}
        usuario={usuario}
        onAbrirRuta={onAbrirRuta}
        onAbrirPerfil={onAbrirPerfil}
      />

      <section className="driver-map-area" aria-label="Mapa de navegacion del viaje">
        <div className={`driver-toast ${deteccion.camaraActiva ? 'ok' : 'alerta'}`}>{mensajeSistema}</div>
        <MapView
          ubicacionActual={geolocalizacion.ubicacionActual}
          rutaRecorrida={geolocalizacion.rutaRecorrida}
          eventos={viaje.eventosDetectados}
          centrarMapaToken={geolocalizacion.centrarMapaToken}
          origenRuta={ruta.origenRuta}
          destinoRuta={ruta.destinoRuta}
          rutaPlanificada={ruta.rutaPlanificada}
          centrarRutaToken={ruta.centrarRutaToken}
        />
      </section>

      <BottomActionBar
        viajeActivo={viaje.viajeActivo}
        camaraActiva={deteccion.camaraActiva}
        cargandoDetector={deteccion.cargandoDetector}
        onIniciarViaje={onIniciarViaje}
        onTerminarViaje={onTerminarViaje}
        onPanic={onPanic}
      />

      {rutaAbierta && <RouteModal ruta={ruta} onClose={onCerrarRuta} />}
    </main>
  )
}

export default DriverMapScreen
