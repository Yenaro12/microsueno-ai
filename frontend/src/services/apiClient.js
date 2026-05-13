const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export const apiRequest = async (endpoint, options = {}) => {
  try {
    const respuesta = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    })

    const data = await respuesta.json().catch(() => null)
    if (!respuesta.ok) {
      throw new Error(data?.error || `HTTP ${respuesta.status}`)
    }

    return { ok: true, data }
  } catch (error) {
    return { ok: false, error }
  }
}
