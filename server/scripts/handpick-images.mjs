// Curación asistida para platos-estrella que el traductor automático no acierta
// pero Unsplash SÍ tiene. Cada entrada fija la query en inglés y el/los términos
// que el metadato de la foto DEBE contener (guardrail intacto). Solo toca
// recetas con imagen NULL. Idempotente y deduplicado.
// Uso: UNSPLASH_ACCESS_KEY=xxx node scripts/handpick-images.mjs [--dry]

import { neon } from '@neondatabase/serverless'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
if (!process.env.DATABASE_URL) {
  const envPath = resolve(__dirname, '..', '.env')
  if (existsSync(envPath)) for (const l of readFileSync(envPath, 'utf8').split('\n')) {
    const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}
const KEY = process.env.UNSPLASH_ACCESS_KEY
const DRY = process.argv.includes('--dry')
if (!KEY || !process.env.DATABASE_URL) { console.error('Falta UNSPLASH_ACCESS_KEY o DATABASE_URL'); process.exit(1) }
const sql = neon(process.env.DATABASE_URL)
const RENDER = '&w=800&q=80&fit=crop&crop=entropy'
const deaccent = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')
const meta = (p) => deaccent([p.description, p.alt_description, ...(p.tags || []).map((t) => t.title)]
  .filter(Boolean).join(' ').toLowerCase()).replace(/[-_]/g, ' ')

// nombre exacto -> { q: query inglesa, terms: [todos deben aparecer en el metadato] }
const PICKS = {
  'Bulgogi': { q: 'bulgogi beef korean', terms: ['bulgogi'] },
  'Gyudon': { q: 'gyudon beef rice bowl', terms: ['beef'] },
  'Yakitori de pollo': { q: 'yakitori chicken skewers', terms: ['yakitori'] },
  'Gyros de pollo': { q: 'chicken gyros', terms: ['gyros'] },
  'Mapo tofu': { q: 'mapo tofu', terms: ['tofu'] },
  'Pollo kung pao': { q: 'kung pao chicken', terms: ['kung pao'] },
  'Pollo teriyaki': { q: 'teriyaki chicken', terms: ['teriyaki'] },
  'Salmón teriyaki': { q: 'teriyaki salmon', terms: ['salmon'] },
  'Tofu teriyaki': { q: 'teriyaki tofu', terms: ['tofu'] },
  'Pollo piccata': { q: 'chicken piccata lemon', terms: ['piccata'] },
  'Pollo al miso': { q: 'miso glazed chicken', terms: ['miso'] },
  'Köfte turco': { q: 'turkish kofte kebab', terms: ['kof'] },
  'Lomo saltado': { q: 'lomo saltado peruvian', terms: ['lomo'] },
  'Chili con carne rápido': { q: 'chili con carne', terms: ['chili'] },
}

const used = new Set()
for (const r of await sql`SELECT imagen FROM recetas WHERE imagen IS NOT NULL`) {
  const m = r.imagen.match(/photo-[a-z0-9-]+/i)
  if (m) used.add(m[0].replace('photo-', ''))
}

let done = 0, miss = 0
for (const [nombre, { q, terms }] of Object.entries(PICKS)) {
  const [row] = await sql`SELECT id FROM recetas WHERE nombre = ${nombre} AND imagen IS NULL`
  if (!row) { console.log(`  — ya tiene foto o no existe: ${nombre}`); continue }
  const res = await fetch(`https://api.unsplash.com/search/photos?per_page=10&orientation=landscape&content_filter=high&query=${encodeURIComponent(q)}`,
    { headers: { Authorization: `Client-ID ${KEY}` } })
  if (res.status === 403) { console.log('\nRate limit. Relanza en ~1h.'); break }
  if (!res.ok) { console.log(`  ! ${nombre}: HTTP ${res.status}`); continue }
  const cand = ((await res.json()).results || []).find((p) => !used.has(p.id) && terms.every((t) => meta(p).includes(t)))
  if (!cand) { console.log(`  · sin match con "${terms.join(',')}" (watermark): ${nombre}`); miss++; continue }
  used.add(cand.id)
  const img = cand.urls.raw + RENDER
  if (!DRY) await sql`UPDATE recetas SET imagen = ${img} WHERE id = ${row.id}`
  done++
  console.log(`  ✓ ${nombre}  [${cand.id}]`)
  await new Promise((s) => setTimeout(s, 200))
}
console.log(`\n${DRY ? '[DRY] ' : ''}curadas: ${done} | watermark: ${miss}`)
