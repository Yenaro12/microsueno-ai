const riesgoEtiqueta = {
  bajo: 'Riesgo bajo',
  medio: 'Riesgo medio',
  alto: 'Riesgo alto',
}

function RiskStatus({ estadoRiesgo, alarmaActiva }) {
  return (
    <div className={`estado-riesgo ${estadoRiesgo} ${alarmaActiva ? 'alarma' : ''}`}>
      <span />
      {alarmaActiva ? 'Alarma activa' : riesgoEtiqueta[estadoRiesgo]}
    </div>
  )
}

export default RiskStatus
