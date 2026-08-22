#!/usr/bin/env node
import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { fichaNutricional } from '../src/lib/nutricion.js'

const sql = neon(process.env.DATABASE_URL)
const args = process.argv.slice(2)
const dry = args.includes('--dry')
const ids = args.filter((a) => !a.startsWith('--'))
const todas = args.includes('--todas')

if (!todas && ids.length === 0) {
  console.error(`
  uso: node scripts/refrescar-ficha.mjs [--dry] (--todas | <id> [<id> ...])

    --dry     enseña lo que cambiaría sin escribir
    --todas   repasa el catálogo entero
`)
  process.exit(1)
}

const filas = todas
  ? await sql`SELECT id, nombre, porciones, ingredientes, hierro::float AS hierro, sin_gluten AS "sinGluten", micros, apto
              FROM recetas WHERE borrada_en IS NULL ORDER BY nombre`
  : await sql`SELECT id, nombre, porciones, ingredientes, hierro::float AS hierro, sin_gluten AS "sinGluten", micros, apto
              FROM recetas WHERE id = ANY(${ids})`

if (!todas && filas.length !== ids.length) {
  const vistos = new Set(filas.map((f) => f.id))
  console.error(`\n  no encontrados: ${ids.filter((i) => !vistos.has(i)).join(', ')}\n`)
  process.exit(1)
}

const CLAVES = ['fibra', 'azucares', 'saturadas', 'sal', 'hierroHemo', 'vitaminaC', 'calcio', 'b12', 'folato']
let tocadas = 0

for (const r of filas) {
  const f = fichaNutricional({ ingredientes: r.ingredientes, porciones: r.porciones })
  const difs = []
  if (f.hierro !== r.hierro) difs.push(`hierro ${r.hierro} -> ${f.hierro}`)
  if (f.sinGluten !== r.sinGluten) difs.push(`sinGluten ${r.sinGluten} -> ${f.sinGluten}`)
  for (const k of CLAVES) {
    if (f.micros[k] !== r.micros?.[k]) difs.push(`${k} ${r.micros?.[k]} -> ${f.micros[k]}`)
  }
  if (f.micros.estimadoDe !== r.micros?.estimadoDe) {
    difs.push(`estimadoDe ${r.micros?.estimadoDe} -> ${f.micros.estimadoDe}`)
  }
  for (const k of ['vegetariana', 'vegana']) {
    if ((f.apto[k] ?? null) !== (r.apto?.[k] ?? null)) difs.push(`${k} ${r.apto?.[k]} -> ${f.apto[k]}`)
  }
  if (difs.length === 0) continue

  tocadas++
  console.log(`  ${r.nombre}`)
  for (const d of difs) console.log(`     ${d}`)

  if (!dry) {
    await sql`
      UPDATE recetas
      SET hierro = ${f.hierro}, sin_gluten = ${f.sinGluten}, micros = ${JSON.stringify(f.micros)},
          apto = ${JSON.stringify(f.apto)}
      WHERE id = ${r.id}
    `
  }
}

console.log(`\n  ${tocadas} de ${filas.length} recetas ${dry ? 'cambiarían' : 'actualizadas'}\n`)
