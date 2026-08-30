import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { neon } from '@neondatabase/serverless'

for (const l of readFileSync('.env', 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const sql = neon(process.env.DATABASE_URL)
const KEY = process.env.UNSPLASH_ACCESS_KEY

const CACHE = 'scripts/unsplash-cache.json'
const cache = new Map(Object.entries(JSON.parse(readFileSync(CACHE, 'utf8'))))
const slug = (url) => url.match(/photo-[a-z0-9-]+/i)?.[0] ?? null

const used = new Set(JSON.parse(readFileSync('scripts/image-blocklist.json', 'utf8')))
for (const r of await sql`SELECT imagen FROM recetas WHERE imagen IS NOT NULL AND borrada_en IS NULL`) {
  const s = slug(r.imagen)
  if (s) used.add(s)
}

const espera = (ms) => new Promise((r) => setTimeout(r, ms))

const CRUDO = /(raw|uncooked|ingredient|ingredients|isolated|white background|market|storefront|grocery|supermarket|packaging|package|label|logo|menu|signage|harvest|harvested|crop|field|farm|seeds|unpeeled|plant|garden|closeup of)/
const SERVIDO = /(plate|plated|bowl|dish|served|serving|meal|dinner|lunch|breakfast|table|garnish|sauce|cooked|baked|roasted|fried|stew|soup|salad|sandwich|dessert|pan|skillet|pot|recipe|homemade|delicious|tasty|food|restaurant)/
const texto = (p) => `${p.description || ''} ${p.alt_description || ''}`.toLowerCase()

async function buscar(query, page) {
  const key = page === 1 ? query : `${query}#${page}`
  if (cache.has(key)) return cache.get(key)
  const url = `https://api.unsplash.com/search/photos?per_page=30&page=${page}&content_filter=high&query=${encodeURIComponent(query)}`
  for (;;) {
    const res = await fetch(url, { headers: { Authorization: `Client-ID ${KEY}` } })
    if (res.status === 403) { console.log('  cuota agotada, espero 16 min'); await espera(16 * 60 * 1000); continue }
    if (!res.ok) throw new Error(`Unsplash ${res.status}`)
    const results = ((await res.json()).results || []).map((p) => ({
      id: p.id, width: p.width, height: p.height, raw: p.urls.raw,
      description: p.description, alt_description: p.alt_description,
    }))
    cache.set(key, results)
    for (let i = 0; i < 5; i++) {
      try { writeFileSync(CACHE, JSON.stringify(Object.fromEntries(cache))); break }
      catch (e) { if (e.code !== 'EBUSY' || i === 4) throw e; await espera(1500) }
    }
    return results
  }
}

const arg = (f) => { const i = process.argv.indexOf(f); return i >= 0 ? process.argv[i + 1] : null }
const fichero = arg('--consultas')
if (!fichero) { console.error('Falta --consultas <fichero.json> con { "Nombre receta": "query" }'); process.exit(1) }
const consultas = JSON.parse(readFileSync(fichero, 'utf8'))
const pendientes = await sql`SELECT id, nombre FROM recetas WHERE imagen IS NULL AND borrada_en IS NULL ORDER BY nombre`
const SALIDA = arg('--salida') || 'scripts/candidatos-rescate.json'
const salida = existsSync(SALIDA) ? JSON.parse(readFileSync(SALIDA, 'utf8')) : []
const hechas = new Set(salida.map((s) => s.nombre))

for (const r of pendientes) {
  const query = consultas[r.nombre]
  if (!query || hechas.has(r.nombre)) continue
  const vistos = new Set()
  const libres = []
  for (const page of [1, 2]) {
    for (const p of await buscar(query, page)) {
      const s = slug(p.raw)
      if (!s || used.has(s) || used.has(p.id) || vistos.has(s)) continue
      vistos.add(s)
      const t = texto(p)
      if (CRUDO.test(t)) continue
      libres.push({ id: p.id, raw: p.raw, txt: t.trim().slice(0, 80), servido: SERVIDO.test(t) })
    }
    if (libres.length >= 8) break
  }
  const cands = libres.sort((a, b) => b.servido - a.servido).slice(0, 4)
  salida.push({ id: r.id, nombre: r.nombre, query, cands })
  writeFileSync(SALIDA, JSON.stringify(salida, null, 2))
  console.log(`${r.nombre.padEnd(36)} ${query.padEnd(30)} ${cands.length}`)
}
console.log(`\nlisto: ${salida.length} recetas`)
