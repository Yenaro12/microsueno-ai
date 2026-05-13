function AlarmControls({ sonidoActivo, onAlternarSonido, onDetenerAlarma }) {
  return (
    <section className="acciones acciones-alarma">
      <button className="boton secundario" type="button" onClick={onAlternarSonido}>
        {sonidoActivo ? 'Silenciar sonido' : 'Activar sonido'}
      </button>
      <button className="boton peligro-suave" type="button" onClick={onDetenerAlarma}>
        Detener alarma
      </button>
    </section>
  )
}

export default AlarmControls
