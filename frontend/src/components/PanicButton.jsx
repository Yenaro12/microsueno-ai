function PanicButton({ onPanic }) {
  return (
    <button className="bottom-button panic" type="button" onClick={onPanic}>
      Boton de panico
    </button>
  )
}

export default PanicButton