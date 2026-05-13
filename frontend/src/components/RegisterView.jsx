import { useState } from 'react'
import { APP_NAME } from '../utils/constants'

function RegisterView({ onRegister, onGoLogin }) {
  const [nombre, setNombre] = useState('Conductor Demo')
  const [correo, setCorreo] = useState('conductor@microsueno.ai')
  const [password, setPassword] = useState('demo123')
  const [mensaje, setMensaje] = useState('')

  const enviar = (evento) => {
    evento.preventDefault()
    const resultado = onRegister({ nombre, correo, password })
    if (!resultado.ok) setMensaje(resultado.mensaje)
  }

  return (
    <main className="auth-screen">
      <section className="auth-card">
        <div className="auth-brand">
          <span>Registro de operador</span>
          <h1>{APP_NAME}</h1>
        </div>
        <form className="auth-form" onSubmit={enviar}>
          <label>
            Nombre
            <input value={nombre} onChange={(evento) => setNombre(evento.target.value)} autoComplete="name" />
          </label>
          <label>
            Correo
            <input value={correo} onChange={(evento) => setCorreo(evento.target.value)} type="email" autoComplete="email" />
          </label>
          <label>
            Contrasena
            <input value={password} onChange={(evento) => setPassword(evento.target.value)} type="password" autoComplete="new-password" />
          </label>
          {mensaje && <p className="auth-error">{mensaje}</p>}
          <button className="auth-primary" type="submit">Registrar usuario</button>
        </form>
        <button className="auth-link" type="button" onClick={onGoLogin}>Ya tengo cuenta</button>
      </section>
    </main>
  )
}

export default RegisterView