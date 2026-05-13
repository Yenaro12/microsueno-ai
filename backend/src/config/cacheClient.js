import NodeCache from 'node-cache'

// Cache por defecto expira en 5 minutos (300 segundos)
export const cache = new NodeCache({ stdTTL: 300, checkperiod: 320 })
