#!/usr/bin/env node
// Recalcula los macros declarados de recetas concretas a partir de su lista de
// ingredientes y nutrientes.json, que es la misma fuente que usa el gate de
// `audit`. Solo toca las cuatro columnas de macros; no altera pasos, consejos,
// ingredientes ni imagen.
//
//   node scripts/sanear-macros.mjs --dry  <id> [<id> ...]
//   node scripts/sanear-macros.mjs        <id> [<id> ...]
//
// Con --dry enseña el antes y el despues sin escribir. Usalo siempre primero:
// cambiar macros en lote es de las cosas que no se ven al revisar la app.
import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { estimarMacros } from '../src/lib/nutricion.js'

const sql = neon(process.env.DATABASE_URL)
const args = process.argv.slice(2)
const dry = args.includes('--dry')
const ids = args.filter((a) => a !== '--dry')

if (ids.length === 0) {
  console.error('\n  uso: node scripts/sanear-macros.mjs [--dry] <id> [<id> ...]\n')
  process.exit(1)
}

const filas = await sql`
  SELECT id, nombre, porciones, ingredientes, calorias, proteinas, carbohidratos, grasas
  FROM recetas WHERE id = ANY(${ids})`

if (filas.length !== ids.length) {
  const vistos = new Set(filas.map((f) => f.id))
  console.error(`\n  no encontrados: ${ids.filter((i) => !vistos.has(i)).join(', ')}\n`)
  process.exit(1)
}

const red = (n) => Math.round(n)
let tocadas = 0

for (const r of filas) {
  const e = estimarMacros({ ingredientes: r.ingredientes, porciones: r.porciones })
  if (e.desconocidos.length) {
    console.log(`  SALTADA  ${r.nombre}  (sin ficha: ${e.desconocidos.join(', ')})`)
    continue
  }
  const p = red(e.proteinas), c = red(e.carbohidratos), g = red(e.grasas)
  const kcal = red(4 * p + 4 * c + 9 * g)
  const antes = `P ${r.proteinas} C ${r.carbohidratos} G ${r.grasas} kcal ${r.calorias}`
  const despues = `P ${p} C ${c} G ${g} kcal ${kcal}`
  console.log(`  ${r.nombre}\n     ${antes}\n  -> ${despues}`)
  if (!dry) {
    await sql`UPDATE recetas SET calorias = ${kcal}, proteinas = ${p},
              carbohidratos = ${c}, grasas = ${g} WHERE id = ${r.id}`
  }
  tocadas++
}

console.log(`\n${tocadas} receta(s) ${dry ? 'se actualizarian' : 'actualizadas'}${dry ? ' (dry run, no se ha escrito nada)' : ''}\n`)
