export const APP_NAME = 'MicroSue\u00f1o AI'

export const FACE_LANDMARKS = {
  INDICE_PUNTO_NARIZ: 1,
}

export const DETECTION = {
  UMBRAL_DESPLAZAMIENTO_PX: 45,
  FACTOR_RETORNO_NORMAL: 0.55,
  TIEMPO_RIESGO_MEDIO_MS: 1500,
  TIEMPO_RIESGO_ALTO_MS: 2000,
  TIEMPO_ALARMA_FUERTE_MS: 3000,
  INTERVALO_BEEP_ALARMA_MS: 330,
  TIEMPO_CALIBRACION_MS: 3000,
  PORCENTAJE_ADVERTENCIA_DESCENSO: 0.12,
  PORCENTAJE_ALTO_DESCENSO: 0.18,
  PORCENTAJE_RETORNO_NORMAL: 0.07,
  VELOCIDAD_DESCENSO_LENTO_PX_S: 8,
  PUNTAJE_RIESGO_ADVERTENCIA: 32,
  PUNTAJE_RIESGO_ALARMA: 68,
  PUNTAJE_RIESGO_MAXIMO: 100,
}

export const TEMPORARY_CACHE = {
  INTERVALO_LIMPIEZA_MS: 90_000,
}

export const MEDIAPIPE = {
  URL_MODELO_CARA:
    'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task',
  URL_WASM_MEDIAPIPE:
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm',
}

export const STORAGE_KEYS = {
  EVENTOS_VIAJE: 'microsueno_eventos_viaje_v1',
  USUARIO: 'microsueno_usuario_v1',
  SESION_ACTIVA: 'microsueno_sesion_activa_v1',
}

export const MAP = {
  CENTRO_INICIAL: [19.4326, -99.1332],
  MIN_DISTANCIA_ENTRE_PUNTOS_METROS: 4,
}

export const TEXTS = {
  ENCUADRE: 'Mant\u00e9n tu rostro dentro del encuadre',
  PWA_ANDROID: 'Instalable en Android desde Chrome',
}

export const RISK_LEVELS = {
  BAJO: 'bajo',
  MEDIO: 'medio',
  ALTO: 'alto',
  ALARMA: 'alarma',
}

export const EVENT_TYPES = {
  CABEZA_ABAJO: 'Cabeza abajo',
  CABEZA_ARRIBA: 'Cabeza arriba',
  ROSTRO_PERDIDO: 'Rostro perdido',
  NARIZ_NO_DETECTADA: 'Nariz no detectada',
  SOMNOLENCIA_PROGRESIVA: 'Somnolencia progresiva',
  CALIBRACION_COMPLETADA: 'Calibracion inicial completada',
  POSTURA_RIESGO: 'Postura de riesgo detectada',
  INICIO_VIAJE: 'Inicio de viaje',
  FIN_VIAJE: 'Fin de viaje',
  PANICO: 'Boton de panico',
  CONEXION_PERDIDA: 'Perdida de conexion',
  CONEXION_RECUPERADA: 'Recuperacion de conexion',
  UBICACION_DETECTADA: 'Ubicacion detectada',
}
