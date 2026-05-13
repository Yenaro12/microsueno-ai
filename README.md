# MicroSueno AI

MicroSueno AI es una PWA para empresas de transporte que combina GPS, mapa de ruta y analisis facial con MediaPipe para detectar eventos de somnolencia durante un viaje.

El prototipo registra cabeza abajo, cabeza arriba, rostro perdido y nariz no detectada. Cada evento puede incluir ubicacion, duracion, desplazamiento, nivel de riesgo, accion tomada, timestamp legible e indice de riesgo del viaje.

## Arquitectura

```text
microsueno-ai/
|-- frontend/   React + Vite + PWA + Leaflet + MediaPipe
`-- backend/    Node.js + Express + storage.json
```

### Frontend

El frontend esta organizado en:

- `frontend/src/components`: navbar, login, registro, perfil, mapa, planificador de ruta, barra inferior, controles, metricas, analisis y tabla.
- `frontend/src/hooks`: deteccion facial, GPS, alarma, ruta, limpieza temporal, sesion de viaje y localStorage.
- `frontend/src/services`: cliente API, servicios para viajes/eventos y servicio de rutas.
- `frontend/src/utils`: calculo de riesgo, CSV, distancias, formatos, constantes y limpieza temporal.
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
- OSRM publico para calculo de rutas
- Nominatim/OpenStreetMap para busqueda opcional de direcciones
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

Frontend por defecto: `http://localhost:5173` (Vite puede usar 5174, 5175, etc. si el puerto esta ocupado).

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

La ruta tipo Uber usa servicios gratuitos por defecto:

```text
VITE_OSRM_URL=https://router.project-osrm.org/route/v1/driving
VITE_NOMINATIM_URL=https://nominatim.openstreetmap.org/search
```

Si en el futuro usas un proveedor con API key, agrega la URL en variables `VITE_*` y conserva OSRM/Nominatim como fallback gratuito.

Si el backend no esta disponible, la app sigue funcionando con `localStorage` y muestra en consola si el guardado fue local.


## Interfaz principal de conductor

La pantalla principal esta pensada como una app GPS tipo Uber para un conductor:

- Arriba: navbar con nombre de la app, estado de conexion, ubicacion actual y acceso a perfil.
- Centro: solo mapa con ruta, origen, destino, ubicacion actual, ruta recorrida y marcadores de alertas.
- Abajo: tres botones fijos: `Iniciar viaje`, `Terminar viaje` y `Boton de panico`.

La camara y el canvas de MediaPipe siguen montados como `DetectionService` en segundo plano para no ensuciar la pantalla principal. Los logs, metricas, alarma manual y analisis siguen disponibles en el `Panel tecnico`, accesible desde el perfil.

## Login, registro y perfil

El flujo de sesion usa almacenamiento local como mock listo para integrarse despues con backend:

1. Si no hay sesion activa, se muestra Login.
2. Desde Login se puede abrir Registro.
3. Al iniciar sesion o registrarse, se entra al mapa principal.
4. Desde el navbar se abre Perfil.
5. En Perfil se puede volver al mapa, abrir Panel tecnico o cerrar sesion.

## Boton de panico

El boton de panico registra un evento critico con nivel `alarma`, activa una alerta sonora/vibracion usando el sistema de alarma existente y conserva el evento en localStorage/backend si esta disponible.
## Limpieza automatica de cache temporal

El frontend ejecuta una limpieza temporal cada 90 segundos mientras la camara o el viaje estan activos. Tambien limpia al ocultar/cerrar la pagina.

Datos que si se limpian:

- Canvas temporales y el canvas de overlay de deteccion.
- Object URLs temporales registrados por el sistema.
- Claves de `sessionStorage` con prefijo `microsueno-temp-`.
- Referencias temporales preparadas para buffers o recursos de procesamiento.

Datos que no se borran:

- Eventos de microsueno.
- Alertas de alarma.
- Eventos de rostro perdido o nariz no detectada.
- Historial guardado en `localStorage`.
- Viajes y eventos guardados en `backend/src/data/storage.json`.
- Logs importantes del viaje.

La limpieza esta en `frontend/src/hooks/useTemporaryCacheCleanup.js` y `frontend/src/utils/temporaryCache.js`.

## Mapa tipo Uber

La seccion de mapa permite ingresar punto de inicio y punto de destino. Puedes escribir:

- Coordenadas en formato `lat,lng`, por ejemplo `18.65288, -99.18417`.
- Una direccion o lugar; el sistema intenta resolverlo con Nominatim.
- Dejar el origen vacio y usar GPS actual con el boton `Usar mi ubicacion`.

Al calcular la ruta:

- OSRM publico genera la linea de ruta sobre OpenStreetMap.
- Si OSRM no responde, se dibuja una linea directa como fallback para no romper la experiencia.
- El mapa mantiene en paralelo la ruta planificada, la ruta recorrida por GPS, el marcador de ubicacion actual y los marcadores de alertas.

La logica esta en `frontend/src/hooks/useRoutePlanner.js`, `frontend/src/services/routeService.js`, `frontend/src/components/RoutePlanner.jsx` y `frontend/src/components/MapView.jsx`.

## Alarma en movil

La alarma se desbloquea despues de una interaccion del usuario al presionar `Iniciar viaje` o `Iniciar camara`. Esto respeta las restricciones de Chrome Android y otros navegadores moviles contra audio automatico.

Mientras se mantenga una condicion de riesgo, la alarma usa Web Audio API y vibracion si esta disponible. Si Web Audio falla, usa el elemento de audio de respaldo.

## Registro de eventos y logs

Los eventos siguen registrandose cuando ocurre:

- Inicio de viaje.`n- Fin de viaje.`n- Activacion del boton de panico.`n- Perdida de conexion.`n- Recuperacion de conexion.`n- Ubicacion detectada.`n- Microsueno por cabeza abajo.`n- Cabeza arriba con riesgo.`n- Rostro perdido.`n- Nariz no detectada.`n- Activacion de alarma.

Cada evento conserva los campos anteriores y agrega un timestamp legible (`fechaHoraEvento` en frontend y `readableTime` en backend). Para verificar logs:

1. Inicia backend y frontend.
2. Presiona `Iniciar viaje`.
3. Provoca un evento de prueba, por ejemplo tapa la camara durante mas de 2 segundos.
4. Revisa la tabla `Eventos detectados`.
5. Revisa `backend/src/data/storage.json` o descarga el CSV.

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
  "readableTime": "12/05/2026, 10:10:00",
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

## Prueba en celular

1. Conecta la laptop y el celular a la misma red.
2. Ejecuta `npm run dev` desde la raiz.
3. Si Vite muestra `Network: use --host to expose`, ejecuta desde `frontend`:

```bash
npm run dev -- --host 0.0.0.0
```

4. Para camara/PWA en celular usa HTTPS. Puedes exponer Vite con un tunel HTTPS como ngrok o Cloudflare Tunnel, o configurar un certificado local. Si abres solo `http://IP:5173`, Chrome Android puede bloquear camara por no ser un origen seguro.
5. Abre la URL HTTPS en Chrome Android y acepta permisos de camara y ubicacion.
6. Presiona `Iniciar viaje` para desbloquear audio, activar GPS y comenzar deteccion.
7. Configura origen/destino y calcula ruta.
8. Tapa la camara o mueve la cabeza para confirmar que se registran eventos y alarma.

## Alcance del prototipo

MicroSueno AI es una prueba de concepto preventiva para HackaTec. No es un sistema medico, legal ni certificado de seguridad vial. El objetivo es demostrar deteccion en tiempo real, geolocalizacion, alarmas, ruta de transporte y analisis de eventos para apoyar decisiones operativas.

## Limitaciones

- La precision depende de la camara, iluminacion, posicion del rostro y permisos del navegador.
- GPS puede variar segun el dispositivo y el entorno.
- OSRM y Nominatim publicos son servicios gratuitos con limites de uso y pueden fallar temporalmente.
- `storage.json` es persistencia simple para prototipo, no reemplaza una base de datos de produccion.
- En moviles, la alarma requiere interaccion del usuario para desbloquear audio.