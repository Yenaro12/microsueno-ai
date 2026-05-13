import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const storagePath = path.resolve(__dirname, '../data/storage.json')

const storageInicial = {
  trips: [],
  events: [],
}

export async function readStorage() {
  try {
    const contenido = await readFile(storagePath, 'utf8')
    const data = JSON.parse(contenido)
    return {
      ...data,
      trips: Array.isArray(data.trips) ? data.trips : [],
      events: Array.isArray(data.events) ? data.events : [],
    }
  } catch {
    await writeStorage(storageInicial)
    return { ...storageInicial }
  }
}

export async function writeStorage(data) {
  await mkdir(path.dirname(storagePath), { recursive: true })
  await writeFile(storagePath, JSON.stringify(data, null, 2), 'utf8')
}

export async function updateStorage(mutador) {
  const data = await readStorage()
  const actualizado = (await mutador(data)) || data
  await writeStorage(actualizado)
  return actualizado
}
