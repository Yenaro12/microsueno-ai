# MicroSueno AI

MicroSueno AI es una PWA para empresas de transporte que combina GPS, mapa de ruta y analisis facial con MediaPipe para detectar eventos de somnolencia durante un viaje.

El prototipo registra cabeza abajo, cabeza arriba, rostro perdido y nariz no detectada. Cada evento puede incluir ubicacion, duracion, desplazamiento, nivel de riesgo, accion tomada e indice de riesgo del viaje.

## Arquitectura

```text
microsueno-ai/
├── frontend/   React + Vite + PWA + Leaflet + MediaPipe
└── backend/    Node.js + Express + storage.json
```

### Frontend

El frontend esta organizado en:

- `frontend/src/components`: camara, mapa, controles, metricas, analisis y tabla.
- `frontend/src/hooks`: deteccion facial, GPS, alarma, sesion de viaje y localStorage.
- `frontend/src/services`: cliente API y servicios para viajes/eventos.
- `frontend/src/utils`: calculo de riesgo, CSV, distancias, formatos y constantes.
- `frontend/src/styles/global.css`: estilos globales de la interfaz.

### Backend

El backend expone una API simple con Express y persiste datos en `backend/src/data/storage.json`.

- `controllers`: entrada HTTP.
- `routes`: rutas Express.
- `services`: logica de viajes y eventos.
- `utils/fileStorage.js`: lectura/escritura del JSON.

## Tecnologias

- React + Vite
- vite-plugin-pwa
- MediaPipe `@mediapipe/tasks-vision`
- Leaflet + React Leaflet + OpenStreetMap
- Web Audio API y vibracion movil
- Node.js + Express
- Persistencia simple con JSON

## Instalacion

Desde la raiz del repositorio:

```bash
npm run install:all
```

Tambien puedes instalar por separado:

```bash
cd frontend
npm install

cd ../backend
npm install
```

## Ejecucion

Para correr frontend y backend juntos desde la raiz:

```bash
npm run dev
```

Para correrlos por separado:

```bash
npm run dev:backend
npm run dev:frontend
```

O directamente:

```bash
cd backend && npm run dev
cd frontend && npm run dev
```

Backend por defecto: `http://localhost:4000`

Frontend por defecto: `http://localhost:5173`

## Build y preview PWA

```bash
cd frontend
npm run build
npm run preview
```

Para probar en Android, abre la app en Chrome usando una URL accesible desde el celular. Chrome permite instalarla desde el menu del navegador cuando la PWA esta servida por HTTPS o por un origen permitido de desarrollo.

## Variables opcionales

El frontend intenta usar el backend en:

```text
http://localhost:4000/api
```

Puedes cambiarlo con:

```text
VITE_API_URL=http://localhost:4000/api
```

Si el backend no esta disponible, la app sigue funcionando con `localStorage` y muestra en consola si el guardado fue local.

## Analisis de datos

El indice de riesgo del viaje va de 0 a 100:

- Evento medio: +5 puntos.
- Evento alto: +10 puntos.
- Evento con alarma: +20 puntos.
- Rostro perdido: +15 puntos.
- Nariz no detectada: +15 puntos.
- Duracion maxima mayor a 5 segundos: +15 puntos.
- Mas de 3 alertas en la sesion: +15 puntos.

Clasificacion:

- 0-30: Riesgo bajo.
- 31-60: Riesgo medio.
- 61-100: Riesgo alto.

## Endpoints backend

### Health

```http
GET /api/health
```

Respuesta:

```json
{ "status": "ok" }
```

### Viajes

```http
POST /api/trips
PATCH /api/trips/:id/finish
GET /api/trips
GET /api/trips/:id
```

Body para crear viaje:

```json
{
  "startedAt": "2026-05-12T10:00:00.000Z",
  "status": "active"
}
```

Body para finalizar viaje:

```json
{
  "finishedAt": "2026-05-12T10:30:00.000Z",
  "riskIndex": 80,
  "distanceKm": 1.2
}
```

### Eventos

```http
POST /api/events
GET /api/events/:tripId
```

Body para guardar evento:

```json
{
  "tripId": "trip-123",
  "time": "2026-05-12T10:10:00.000Z",
  "type": "Cabeza abajo",
  "level": "alarma",
  "delta": 120,
  "duration": 3.4,
  "lat": 18.65288,
  "lng": -99.18417,
  "riskIndex": 75,
  "action": "Alarma fuerte por cabeza abajo"
}
```

## Alcance del prototipo

MicroSueno AI es una prueba de concepto preventiva para HackaTec. No es un sistema medico, legal ni certificado de seguridad vial. El objetivo es demostrar deteccion en tiempo real, geolocalizacion, alarmas y analisis de eventos para apoyar decisiones operativas.

## Limitaciones

- La precision depende de la camara, iluminacion, posicion del rostro y permisos del navegador.
- GPS puede variar segun el dispositivo y el entorno.
- `storage.json` es persistencia simple para prototipo, no reemplaza una base de datos de produccion.
- En moviles, la alarma requiere interaccion del usuario para desbloquear audio.
