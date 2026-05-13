import { crearPayloadEventoSupabase } from '../domain/eventContract'
import { crearPayloadViajeSupabase } from '../domain/tripContract'
import { supabase } from './supabaseClient'

const TABLAS = {
  DRIVERS: 'drivers',
  TRIPS: 'trips',
  EVENTS: 'events',
}

const capturarError = (contexto, error) => {
  if (error) console.warn(`Supabase ${contexto}:`, error.message || error)
}

export const guardarConductorSupabase = async (conductor = {}) => {
  if (!supabase || !conductor.driverId) return { ok: false, skipped: true }

  const { error } = await supabase.from(TABLAS.DRIVERS).upsert({
    id: conductor.driverId,
    name: conductor.driverName || 'Conductor sin asignar',
    email: conductor.driverEmail || '',
    updated_at: new Date().toISOString(),
  })
  capturarError('driver upsert', error)
  return { ok: !error, error }
}

export const guardarViajeSupabase = async (viaje = {}) => {
  if (!supabase || !viaje.id) return { ok: false, skipped: true }

  await guardarConductorSupabase(viaje)
  const { error } = await supabase.from(TABLAS.TRIPS).upsert(crearPayloadViajeSupabase(viaje))
  capturarError('trip upsert', error)
  return { ok: !error, error }
}

export const guardarEventoSupabase = async (evento = {}) => {
  if (!supabase || !evento.id) return { ok: false, skipped: true }

  await guardarConductorSupabase(evento)
  const { error } = await supabase.from(TABLAS.EVENTS).upsert(crearPayloadEventoSupabase(evento))
  capturarError('event upsert', error)
  return { ok: !error, error }
}

export const suscribirMonitoreoAdmin = ({ driverId, onEvento, onViaje, onEstado } = {}) => {
  if (!supabase) {
    onEstado?.('Supabase no configurado; usando API local.')
    return () => {}
  }

  const filtro = driverId ? `driver_id=eq.${driverId}` : undefined
  const canal = supabase.channel(`microsueno-admin-${driverId || 'todos'}`)

  canal
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: TABLAS.EVENTS, ...(filtro ? { filter: filtro } : {}) },
      (payload) => onEvento?.(payload),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: TABLAS.TRIPS, ...(filtro ? { filter: filtro } : {}) },
      (payload) => onViaje?.(payload),
    )
    .subscribe((estado) => onEstado?.(`Realtime: ${estado}`))

  return () => {
    supabase.removeChannel(canal)
  }
}
