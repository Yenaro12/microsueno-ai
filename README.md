# MicroSueno AI

PWA para empresas de transporte que combina GPS, ruta tipo Uber, deteccion facial con MediaPipe, alarma movil y analisis de eventos de somnolencia.

El prototipo registra cabeza abajo, cabeza arriba, somnolencia progresiva, rostro perdido, nariz no detectada, boton de panico, conexion y eventos de viaje. Cada evento conserva conductor, viaje, ubicacion, duracion, nivel, accion tomada, timestamp legible e indice de riesgo.

## Arquitectura

```text
microsueno-ai/
|-- frontend/   React + Vite + PWA + Leaflet + MediaPipe + Supabase client
|-- backend/    Node.js + Express + storage.json
`-- docs/       arquitectura y preparacion Supabase Realtime
```

Documentacion extendida:

- [Arquitectura](docs/architecture.md)
- [Supabase Realtime](docs/supabase-realtime.md)

## Frontend

Carpetas principales:

- `frontend/src/components`: UI reutilizable.
- `frontend/src/features/driver`: experiencia limpia del conductor.
- `frontend/src/features/admin`: vista `/admin` para supervision.
- `frontend/src/hooks`: camara, GPS, alarma, sesion, ruta, conexion y limpieza temporal.
- `frontend/src/services`: API local, Supabase, rutas y servicios de datos.
- `frontend/src/domain`: contratos de viaje/evento enviados a backend y Supabase.
- `frontend/src/utils`: calculos, formatos, identidad y constantes.

## Backend

El backend expone una API Express y persiste en `backend/src/data/storage.json`.

- `routes`: rutas HTTP.
- `controllers`: entrada/salida de API.
- `services`: logica de viajes, eventos y admin.
- `contracts`: normalizacion de datos recibidos.
- `utils/fileStorage.js`: lectura/escritura segura del JSON.

## Instalacion

Desde la raiz:

```bash
npm run install:all
```

O por separado:

```bash
cd backend
npm install
npm run dev

cd frontend
npm install
npm run dev
```

## Ejecucion

Desde la raiz:

```bash
npm run dev
```

Scripts utiles:

```bash
npm run dev:backend
npm run dev:frontend
npm run build:frontend
npm run preview:frontend
```

Backend: `http://localhost:4000`

Frontend: `http://localhost:5173` o el puerto libre que asigne Vite.

## Variables

El frontend incluye `frontend/.env.example`:

```text
VITE_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SUPABASE_URL=https://vmhxbhhdujhpnmjwooqh.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_fRfMiDeDz1HrkxIU0tJvOQ_IuULRQIc
VITE_OSRM_URL=https://router.project-osrm.org/route/v1/driving
VITE_NOMINATIM_URL=https://nominatim.openstreetmap.org/search
```

Vite acepta `NEXT_PUBLIC_*` gracias a `envPrefix`.

## Pantallas

### Conductor

La pantalla principal mantiene el estilo GPS:

- Navbar con app, conexion, ubicacion y perfil.
- Mapa central con ruta, ubicacion y marcadores de alerta.
- Mini camara flotante con seguimiento de rostro/nariz.
- Barra inferior con `Iniciar viaje`, `Terminar viaje` y `Boton de panico`.

Los logs, metricas y controles tecnicos siguen en `Perfil > Panel tecnico`.

### Administrador

Abre:

```text
http://localhost:5173/admin
```

El administrador puede seleccionar un empleado y ver:

- Datos del conductor.
- Viajes y viajes activos.
- Alertas recientes.
- Eventos por tipo.
- Duracion maxima y promedio.
- Kilometros y alertas por kilometro.
- Indice de riesgo y recomendacion.

La vista escucha cambios Realtime en Supabase cuando las tablas estan creadas y Realtime esta activo. Si Supabase no esta listo, usa la API local.

## Contrato de datos

Viajes enviados por frontend y recibidos por backend:

```json
{
  "id": "viaje-123",
  "startedAt": "2026-05-12T10:00:00.000Z",
  "finishedAt": null,
  "status": "active",
  "driverId": "driver-demo",
  "driverName": "Conductor Demo",
  "driverEmail": "conductor@microsueno.ai",
  "riskIndex": null,
  "distanceKm": null
}
```

Eventos enviados por frontend y recibidos por backend:

```json
{
  "id": "evento-123",
  "tripId": "viaje-123",
  "driverId": "driver-demo",
  "driverName": "Conductor Demo",
  "driverEmail": "conductor@microsueno.ai",
  "time": "2026-05-12T10:10:00.000Z",
  "readableTime": "12/05/2026, 10:10:00",
  "type": "Cabeza abajo",
  "level": "alarma",
  "delta": 120,
  "duration": 3.4,
  "durationMs": 3400,
  "lat": 18.65288,
  "lng": -99.18417,
  "riskIndex": 75,
  "action": "Alarma fuerte por cabeza abajo",
  "source": "frontend"
}
```

## Endpoints

```http
GET /api/health
POST /api/trips
PATCH /api/trips/:id/finish
GET /api/trips
GET /api/trips/:id
POST /api/events
GET /api/events/:tripId
GET /api/admin/drivers
GET /api/admin/drivers/:driverId/summary
```

## Prueba en celular

1. Conecta laptop y celular a la misma red.
2. Ejecuta backend y frontend.
3. Expone Vite con host:

```bash
cd frontend
npm run dev -- --host 0.0.0.0
```

4. Para camara/PWA en Android usa HTTPS o un origen seguro. Chrome puede bloquear camara en `http://IP:5173`.
5. Abre la app en Chrome Android, acepta permisos de camara y ubicacion.
6. Presiona `Iniciar viaje` para desbloquear audio, GPS y deteccion.
7. Baja lentamente la cabeza o tapa la camara para verificar eventos, alarma y logs.

## Limpieza temporal

La limpieza automatica libera recursos temporales cada 90 segundos mientras hay viaje o camara activa.

Si se limpia:

- Canvas temporales.
- Object URLs temporales.
- Claves `sessionStorage` con prefijo `microsueno-temp-`.
- Referencias de buffers temporales.

No se limpia:

- Eventos.
- Alertas.
- Historial de detecciones.
- Viajes.
- Logs persistidos en backend o localStorage.

## Alcance

MicroSueno AI es una prueba de concepto preventiva para HackaTec. No es un sistema medico, legal ni certificado de seguridad vial.

## Limitaciones

- La precision depende de camara, luz, posicion y permisos.
- GPS puede variar por dispositivo y entorno.
- OSRM/Nominatim son servicios gratuitos con limites.
- `storage.json` es persistencia de prototipo.
- Audio movil requiere interaccion del usuario.
- Las politicas Supabase del documento son para prototipo y deben endurecerse en produccion.
