export const calcularDistanciaMetros = (origen, destino) => {
  if (!origen || !destino) return 0
  const radioTierra = 6371000
  const lat1 = (origen.latitud * Math.PI) / 180
  const lat2 = (destino.latitud * Math.PI) / 180
  const deltaLat = ((destino.latitud - origen.latitud) * Math.PI) / 180
  const deltaLng = ((destino.longitud - origen.longitud) * Math.PI) / 180
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2
  return radioTierra * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export const calcularKilometrosRuta = (ruta = []) =>
  ruta.reduce(
    (total, punto, indice) =>
      indice === 0 ? 0 : total + calcularDistanciaMetros(ruta[indice - 1], punto),
    0,
  ) / 1000
