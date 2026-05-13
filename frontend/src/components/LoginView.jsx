import { useState } from 'react'
import { APP_NAME } from '../utils/constants'

function LoginView({ onLogin, onGoRegister }) {
  const [correo, setCorreo] = useState('conductor@microsueno.ai')
  const [password, setPassword] = useState('demo123')
  const [mensaje, setMensaje] = useState('')

  const enviar = (evento) => {
    evento.preventDefault()
    const resultado = onLogin({ correo, password })
    if (!resultado.ok) setMensaje(resultado.mensaje)
  }

  return (
    <main className="auth-screen">
      <section className="auth-card">
        <div className="auth-brand">
          <span>GPS inteligente para transporte</span>
          <h1>{APP_NAME}</h1>
        </div>
        <form className="auth-form" onSubmit={enviar}>
          <label>
            Correo
            <input value={correo} onChange={(evento) => setCorreo(evento.target.value)} type="email" autoComplete="email" />
          </label>
          <label>
            Contrasena
            <input value={password} onChange={(evento) => setPassword(evento.target.value)} type="password" autoComplete="current-password" />
          </label>
          {mensaje && <p className="auth-error">{mensaje}</p>}
          <button className="auth-primary" type="submit">Iniciar sesion</button>
        </form>
        <button className="auth-link" type="button" onClick={onGoRegister}>Crear cuenta de conductor</button>
      </section>
    </main>
  )
}

export default LoginView