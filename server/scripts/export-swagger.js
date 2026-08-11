// Vuelca la especificación a docs/swagger.json.
//
//   node server/scripts/export-swagger.js
//
// Iba con require sobre un módulo ESM, así que no funcionaba.
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import swaggerSpec from '../src/config/swagger.js'

const aqui = dirname(fileURLToPath(import.meta.url))
const destino = resolve(aqui, '../../docs/swagger.json')

writeFileSync(destino, JSON.stringify(swaggerSpec, null, 2) + '\n')
console.log(`swagger.json generado con ${Object.keys(swaggerSpec.paths ?? {}).length} rutas en ${destino}`)
