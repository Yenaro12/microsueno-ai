# Arquitectura de MicroSueno AI

MicroSueno AI esta separado en dos aplicaciones:

- `frontend`: PWA React + Vite para conductor y administrador.
- `backend`: API Node.js + Express con persistencia simple en `storage.json`.

## Frontend

Capas principales:

- `components`: componentes reutilizables de UI.
- `features/driver`: composicion de la experiencia del conductor.
- `features/admin`: panel de supervision por empleado.
- `hooks`: estado y efectos del navegador, camara, GPS, viaje y alarma.
- `services`: integraciones externas, API local, Supabase y rutas.
- `domain`: contratos de datos para viajes y eventos.
- `utils`: calculos puros, formato, identidad y constantes.

`App.jsx` solo decide la ruta principal:

- `/`: flujo de login/conductor.
- `/registro`: registro local.
- `/admin`: panel de administrador.

## Backend

Capas principales:

- `routes`: rutas HTTP.
- `controllers`: entrada/salida de Express.
- `services`: logica de viajes, eventos y panel admin.
- `contracts`: normalizacion de payloads recibidos desde frontend.
- `utils/fileStorage.js`: persistencia en JSON.

## Contratos de datos

Los datos enviados por el frontend se normalizan antes de salir:

- `frontend/src/domain/tripContract.js`
- `frontend/src/domain/eventContract.js`

El backend vuelve a normalizar al recibir:

- `backend/src/contracts/tripContract.js`
- `backend/src/contracts/eventContract.js`

Campos clave de viaje:

- `id`
- `startedAt`
- `finishedAt`
- `status`
- `driverId`
- `driverName`
- `driverEmail`
- `riskIndex`
- `distanceKm`

Campos clave de evento:

- `id`
- `tripId`
- `driverId`
- `driverName`
- `driverEmail`
- `time`
- `readableTime`
- `type`
- `level`
- `delta`
- `duration`
- `durationMs`
- `lat`
- `lng`
- `riskIndex`
- `action`
- `source`

## Admin

La vista `/admin` consume:

- `GET /api/admin/drivers`
- `GET /api/admin/drivers/:driverId/summary`

El administrador selecciona un empleado y ve:

- Datos del conductor.
- Viajes.
- Alertas recientes.
- Eventos por tipo.
- Duracion maxima y promedio.
- Kilometros y alertas por kilometro.
- Indice de riesgo.
- Recomendacion operativa.

## Supabase Realtime

El frontend queda preparado para sincronizar viajes y eventos con Supabase y escuchar cambios en tiempo real desde `/admin`.

La integracion vive en:

- `frontend/src/config/supabaseConfig.js`
- `frontend/src/services/supabaseClient.js`
- `frontend/src/services/supabaseRealtimeService.js`

Si Supabase no responde o las tablas aun no existen, la app conserva el flujo local con API/backend y `localStorage`.
