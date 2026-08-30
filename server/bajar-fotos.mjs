import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { neon } from '@neondatabase/serverless'
import { tmpdir } from 'node:os'

for (const l of readFileSync('.env', 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const sql = neon(process.env.DATABASE_URL)
const SP = `${process.env.TANDA_DIR || `${tmpdir()}/recetarium-tanda`}/fotos`
mkdirSync(SP, { recursive: true })

const arg = (f) => { const i = process.argv.indexOf(f); return i >= 0 ? process.argv[i + 1] : null }
const desde = Number(arg('--desde') || 0)
const cuantas = Number(arg('--cuantas') || 12)

const lista = arg('--lista')
const rows = lista
  ? await sql`SELECT id, nombre, imagen FROM recetas WHERE nombre = ANY(${JSON.parse(readFileSync(lista, 'utf8'))})
      AND imagen IS NOT NULL AND borrada_en IS NULL ORDER BY nombre`
  : await sql`SELECT id, nombre, imagen FROM recetas
      WHERE imagen IS NOT NULL AND borrada_en IS NULL ORDER BY nombre`
const lote = rows.slice(desde, desde + cuantas)
const idx = []
for (const [i, r] of lote.entries()) {
  const url = r.imagen.replace(/&w=\d+&h=\d+/, '&w=340&h=255')
  const res = await fetch(url)
  const buf = Buffer.from(await res.arrayBuffer())
  const f = `${SP}/${String(desde + i).padStart(3, '0')}.jpg`
  writeFileSync(f, buf)
  idx.push({ n: desde + i, id: r.id, nombre: r.nombre, file: f })
}
writeFileSync(SP + '/indice.json', JSON.stringify(idx, null, 2))
for (const e of idx) console.log(`${e.n}  ${e.nombre}`)
console.log(`\ntotal con foto: ${rows.length}`)
