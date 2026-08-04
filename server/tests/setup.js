import { config } from 'dotenv'

config({ path: 'server/.env.test', override: true })

// Estos tests escriben de verdad: crean y borran recetas y machacan la fila
// única de app_estado. Si DATABASE_URL no apunta a la rama de pruebas de Neon,
// abortan antes de tocar nada.
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
