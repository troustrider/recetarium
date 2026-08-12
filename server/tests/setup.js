import { config } from 'dotenv'

config({ path: 'server/.env.test', override: true })

const ENDPOINT_PRUEBAS = 'ep-gentle-field-abm7rrx3'

if (!process.env.DATABASE_URL) {
  throw new Error('Falta DATABASE_URL. Crea server/.env.test apuntando a la rama de pruebas de Neon.')
}

if (!process.env.DATABASE_URL.includes(ENDPOINT_PRUEBAS)) {
  throw new Error(
    `DATABASE_URL no apunta a la rama de pruebas (${ENDPOINT_PRUEBAS}). ` +
      'Abortado para no escribir sobre producción.'
  )
}

const { afterAll } = await import('vitest')
const { limpiarCreados } = await import('./helpers.js')
afterAll(limpiarCreados)
