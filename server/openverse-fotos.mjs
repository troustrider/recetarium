import { readFileSync, writeFileSync } from 'node:fs'
import { neon } from '@neondatabase/serverless'

for (const l of readFileSync('.env', 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const sql = neon(process.env.DATABASE_URL)
const UA = 'recetarium/1.0 (https://github.com/troustrider/recetarium; akarim1398@gmail.com)'
const arg = (f) => { const i = process.argv.indexOf(f); return i >= 0 ? process.argv[i + 1] : null }
const pausa = (ms) => new Promise((r) => setTimeout(r, ms))

const FUERA = /(raw|uncooked|ingredient|market|shop|store|menu|sign|packet|package|label|restaurant exterior|street)/i

async function buscar(q) {
  const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&page_size=20&mature=false&license_type=commercial,modification`
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) return []
  return (await res.json()).results || []
}

const consultas = JSON.parse(readFileSync(arg('--consultas'), 'utf8'))
const recetas = await sql`SELECT id, nombre FROM recetas WHERE borrada_en IS NULL`
const salida = []
for (const [nombre, queries] of Object.entries(consultas)) {
  const receta = recetas.find((r) => r.nombre === nombre)
  if (!receta) { console.log(`  ? no está: ${nombre}`); continue }
  const vistos = new Set()
  const cands = []
  for (const q of queries) {
    for (const p of await buscar(q)) {
      if (!p.url || vistos.has(p.url)) continue
      if (FUERA.test(p.title || '')) continue
      if (p.width && p.height && (p.width < 700 || p.width < p.height)) continue
      vistos.add(p.url)
      cands.push({
        id: p.id,
        raw: p.url,
        txt: `${p.title || ''} (${p.provider})`.slice(0, 80),
        credito: {
          fichero: p.title || '',
          autor: p.creator || '',
          licencia: `${(p.license || '').toUpperCase()} ${p.license_version || ''}`.trim(),
          pagina: p.foreign_landing_url || p.detail_url || '',
          fuente: p.provider || 'openverse',
        },
      })
    }
    await pausa(400)
    if (cands.length >= 8) break
  }
  salida.push({ id: receta.id, nombre, query: queries.join(' | '), cands: cands.slice(0, 6) })
  console.log(`${nombre.padEnd(36)} ${String(cands.length).padStart(2)}`)
}
writeFileSync(arg('--salida') || 'scripts/candidatos-openverse.json', JSON.stringify(salida, null, 2))
console.log(`\n${salida.length} recetas`)
