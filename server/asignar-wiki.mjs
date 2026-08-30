import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { neon } from '@neondatabase/serverless'
import { tmpdir } from 'node:os'

for (const l of readFileSync('.env', 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const sql = neon(process.env.DATABASE_URL)
const SP = process.env.TANDA_DIR || `${tmpdir()}/recetarium-tanda`

const idx = JSON.parse(readFileSync(SP + '/tanda/indice.json', 'utf8'))
const dec = JSON.parse(readFileSync(process.argv[2], 'utf8'))
const arg = (f) => { const i = process.argv.indexOf(f); return i >= 0 ? process.argv[i + 1] : null }
const cands = JSON.parse(readFileSync(arg('--cands') || 'scripts/candidatos-wiki.json', 'utf8'))
const DRY = process.argv.includes('--dry')

const CRED = 'scripts/image-credits.json'
const creditos = existsSync(CRED) ? JSON.parse(readFileSync(CRED, 'utf8')) : {}
const limpia = (u) => u.split('?')[0]

let ok = 0
for (const e of idx) {
  const clave = `g${String(e.grupo).padStart(2, '0')}${e.letra}`
  const elegido = dec[clave]
  if (!elegido) continue
  const receta = cands.find((c) => c.id === e.id)
  const c = receta?.cands[elegido - 1]
  if (!c) { console.log(`  ? ${clave} sin candidato ${elegido}`); continue }
  const url = limpia(c.raw)
  if (!DRY) {
    await sql`UPDATE recetas SET imagen = ${url} WHERE id = ${e.id}`
    creditos[e.nombre] = { url, ...c.credito }
  }
  ok++
  console.log(`  ✓ ${e.nombre}  <- ${c.credito.fichero.replace(/^File:/, '')} (${c.credito.licencia})`)
}
if (!DRY) writeFileSync(CRED, JSON.stringify(creditos, null, 2))
const [n] = await sql`SELECT COUNT(*)::int c FROM recetas WHERE imagen IS NULL AND borrada_en IS NULL`
console.log(`\n${DRY ? '[DRY] ' : ''}asignadas: ${ok} | sin foto: ${n.c}`)
