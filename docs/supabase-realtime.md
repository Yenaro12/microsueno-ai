# Supabase Realtime

El proyecto esta preparado para Supabase Realtime con variables compatibles con Vite y el prefijo solicitado:

```text
NEXT_PUBLIC_SUPABASE_URL=https://vmhxbhhdujhpnmjwooqh.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_fRfMiDeDz1HrkxIU0tJvOQ_IuULRQIc
```

Vite fue configurado con `envPrefix: ['VITE_', 'NEXT_PUBLIC_']`, por lo que estas variables son visibles desde `import.meta.env`.

## Tablas sugeridas

Ejecuta este SQL en el editor de Supabase para preparar las tablas:

```sql
create table if not exists public.drivers (
  id text primary key,
  name text not null,
  email text,
  updated_at timestamptz default now()
);

create table if not exists public.trips (
  id text primary key,
  started_at timestamptz not null,
  finished_at timestamptz,
  status text not null default 'active',
  driver_id text not null references public.drivers(id) on delete cascade,
  driver_name text not null,
  driver_email text,
  risk_index numeric,
  distance_km numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.events (
  id text primary key,
  trip_id text not null,
  driver_id text not null references public.drivers(id) on delete cascade,
  driver_name text not null,
  driver_email text,
  event_time timestamptz not null,
  readable_time text,
  type text not null,
  level text not null,
  delta numeric default 0,
  duration_seconds numeric default 0,
  duration_ms numeric default 0,
  lat numeric,
  lng numeric,
  risk_index numeric default 0,
  action text,
  source text default 'frontend',
  created_at timestamptz default now()
);
```

## Activar Realtime

En Supabase:

1. Abre `Database > Replication`.
2. Activa Realtime para:
   - `drivers`
   - `trips`
   - `events`
3. Verifica que las politicas RLS permitan `select`, `insert` y `update` para la llave publishable durante el prototipo.

Para HackaTec puedes usar politicas permisivas de prototipo:

```sql
alter table public.drivers enable row level security;
alter table public.trips enable row level security;
alter table public.events enable row level security;

create policy "prototype drivers read" on public.drivers for select using (true);
create policy "prototype drivers write" on public.drivers for insert with check (true);
create policy "prototype drivers update" on public.drivers for update using (true);

create policy "prototype trips read" on public.trips for select using (true);
create policy "prototype trips write" on public.trips for insert with check (true);
create policy "prototype trips update" on public.trips for update using (true);

create policy "prototype events read" on public.events for select using (true);
create policy "prototype events write" on public.events for insert with check (true);
create policy "prototype events update" on public.events for update using (true);
```

En produccion estas politicas deben reemplazarse por reglas por empresa, rol y empleado.

## Flujo actual

- El conductor inicia viaje.
- `useTripSession` crea viaje y eventos con `driverId`, `driverName` y `driverEmail`.
- `tripService` y `eventService` envian a la API local y tambien intentan sincronizar con Supabase.
- `/admin` escucha `postgres_changes` en `trips` y `events`.
- Si Realtime recibe cambios, el panel refresca el resumen del empleado seleccionado.

Si Supabase no tiene tablas o RLS bloquea la escritura, el sistema sigue funcionando con backend local y logs en consola.
