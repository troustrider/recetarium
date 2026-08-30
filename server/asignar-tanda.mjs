import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { neon } from '@neondatabase/serverless'
import { tmpdir } from 'node:os'

for (const l of readFileSync('.env', 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const sql = neon(process.env.DATABASE_URL)
const SP = (process.env.TANDA_DIR || `${tmpdir()}/recetarium-tanda`)
const RENDER = '&w=800&h=600&q=80&fit=crop&crop=entropy'

const idx = JSON.parse(readFileSync(SP + '/tanda/indice.json', 'utf8'))
const dec = JSON.parse(readFileSync(process.argv[2], 'utf8'))
const DRY = process.argv.includes('--dry')

const BLOCK = 'scripts/image-blocklist.json'
const bloqueadas = existsSync(BLOCK) ? JSON.parse(readFileSync(BLOCK, 'utf8')) : []

let ok = 0, no = 0
for (const e of idx) {
  const clave = `g${String(e.grupo).padStart(2, '0')}${e.letra}`
  const elegido = dec[clave]
  if (!elegido) {
    no++
    for (const c of e.cands) {
      const s = c.raw.match(/photo-[a-z0-9-]+/i)?.[0]
      if (s && !bloqueadas.includes(s)) bloqueadas.push(s)
    }
    continue
  }
  const c = e.cands[elegido - 1]
  if (!c) { console.log(`  ? ${clave} sin candidato ${elegido}`); continue }
  if (!DRY) await sql`UPDATE recetas SET imagen = ${c.raw + RENDER} WHERE id = ${e.id}`
  ok++
  console.log(`  ✓ ${e.nombre}  <- ${clave}${elegido}`)
}
if (!DRY) writeFileSync(BLOCK, JSON.stringify(bloqueadas, null, 2))
const [n] = await sql`SELECT COUNT(*)::int c FROM recetas WHERE imagen IS NULL AND borrada_en IS NULL`
console.log(`\n${DRY ? '[DRY] ' : ''}asignadas: ${ok} | descartadas: ${no} | watermark: ${n.c}`)
