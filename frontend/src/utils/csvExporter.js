import { formatoNumero } from './formatters'

const escaparCSV = (valor) => `"${String(valor ?? '').replaceAll('"', '""')}"`

export const descargarReporteCSV = (eventos = [], idViaje = 'microsueno-viaje') => {
  const encabezados = [
    'idViaje',
    'driverId',
    'driverName',
    'driverEmail',
    'horaInicioViaje',
    'horaEvento',
    'tipoEvento',
    'nivel',
    'desplazamiento',
    'duracion',
    'latitud',
    'longitud',
    'indiceRiesgoActual',
    'accion',
  ]
  const filas = eventos.map((evento) => [
    evento.idViaje,
    evento.driverId,
    evento.driverName,
    evento.driverEmail,
    evento.horaInicioViaje,
    evento.fechaHoraEvento || evento.horaEvento,
    evento.tipoEvento,
    evento.nivel,
    formatoNumero(evento.desplazamiento, 1),
    formatoNumero((evento.duracionMs || 0) / 1000, 2),
    evento.latitud,
    evento.longitud,
    evento.indiceRiesgoActual,
    evento.accion,
  ])
  const csv = [encabezados, ...filas]
    .map((fila) => fila.map(escaparCSV).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = `${idViaje || 'microsueno-viaje'}-reporte.csv`
  enlace.click()
  URL.revokeObjectURL(url)
}
