// Rellena recetas.imagen con fotos de Unsplash, con guardrail de relevancia.
// Uso: UNSPLASH_ACCESS_KEY=xxx node scripts/fill-recipe-images.mjs [--dry]
//
// Guardrail (evita fotos que no son el plato):
//   1) Traduce el nombre ES -> keywords EN (Unsplash indexa en inglés).
//   2) Pide 10 candidatos y EXIGE que los metadatos (alt/description/tags) de la
//      foto contengan el ingrediente/plato principal. Si ninguno cumple, deja
//      NULL (la tarjeta cae al watermark tipográfico, que es intencional).
//   3) Deduplica: no repite la misma foto en dos recetas.
// Idempotente: solo procesa imagen NULL y actualiza una a una.

import { neon } from '@neondatabase/serverless'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { faltan } from './despensa-match.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
if (!process.env.DATABASE_URL) {
  const envPath = resolve(__dirname, '..', '.env')
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  }
}
const KEY = process.env.UNSPLASH_ACCESS_KEY
const DRY = process.argv.includes('--dry')
if (!KEY) { console.error('Falta UNSPLASH_ACCESS_KEY'); process.exit(1) }
if (!process.env.DATABASE_URL) { console.error('Falta DATABASE_URL'); process.exit(1) }
const sql = neon(process.env.DATABASE_URL)

const RENDER = '&w=800&q=80&fit=crop&crop=entropy'
const deaccent = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')

// Platos con nombre propio: su nombre ES el término distintivo. Si aparece uno,
// se convierte en el PRIMARY exigido a la foto (mucho más preciso que la
// proteína genérica). El valor es la frase EN que debe estar en los metadatos.
const DISH = {
  bibimbap: 'bibimbap', katsudon: 'katsudon', gyudon: 'gyudon', oyakodon: 'oyakodon',
  bulgogi: 'bulgogi', mapo: 'mapo tofu', ramen: 'ramen', gyozas: 'gyoza', gyoza: 'gyoza',
  risotto: 'risotto', tiramisu: 'tiramisu', teriyaki: 'teriyaki', satay: 'satay',
  yakitori: 'yakitori', shawarma: 'shawarma', shoarma: 'shawarma', shakshuka: 'shakshuka',
  menemen: 'menemen', skyr: 'skyr', souvlaki: 'souvlaki', gyros: 'gyros', kofte: 'kofte',
  piccata: 'piccata', quesadillas: 'quesadilla', poke: 'poke bowl', nasi: 'nasi goreng',
  miso: 'miso', kung: 'kung pao', pesto: 'pesto', chili: 'chili con carne', larb: 'larb',
  bolonesa: 'bolognese', kapsalon: 'kapsalon', stamppot: 'stamppot', uitsmijter: 'uitsmijter',
  maafe: 'peanut stew', sundubu: 'sundubu jjigae', lomo: 'lomo saltado', frittata: 'frittata',
  fajitas: 'fajitas', burrito: 'burrito', gratinado: 'gratin', gratinados: 'gratin',
  graten: 'gratin', tzatziki: 'tzatziki',
  // Platos cuyo distintivo se perdía al traducir (leche->STOP, griega sin alias):
  griega: 'greek salad', frita: 'fried custard',
  // Tanda nueva (udon, indonesio y varios): el nombre propio es el término preciso.
  udon: 'udon', rendang: 'rendang', gado: 'gado gado', soto: 'soto ayam',
  mie: 'mie goreng', tikka: 'tikka masala', dal: 'dal', falafel: 'falafel',
  harira: 'harira', char: 'char siu', chow: 'chow mein', ropa: 'ropa vieja',
}
// Ingredientes/formas ES -> EN. Marcan keywords secundarias y, si no hay plato
// distintivo, el primero traducido es el PRIMARY.
const LEX = {
  albondigas: 'meatballs', arroz: 'rice', caldoso: 'rice', bacalao: 'cod', atun: 'tuna',
  salmon: 'salmon', pescado: 'fish', pavo: 'turkey', pollo: 'chicken', jamon: 'ham',
  huevo: 'egg', huevos: 'eggs', gambas: 'shrimp', ternera: 'beef', cerdo: 'pork',
  solomillo: 'pork', carne: 'meat', picadillo: 'beef', chorizo: 'chorizo',
  rookworst: 'sausage', caballa: 'mackerel', tofu: 'tofu', ayam: 'chicken',
  berenjena: 'eggplant', berenjenas: 'eggplant', parmesana: 'parmesan',
  garbanzos: 'chickpeas', alubias: 'beans', judias: 'beans', lentejas: 'lentils',
  estofado: 'stew', guisado: 'stew', guiso: 'stew', sopa: 'soup', ensalada: 'salad',
  curry: 'curry', pasta: 'pasta', macarrones: 'macaroni', noodles: 'noodles',
  fideos: 'noodles', tortilla: 'omelette', omelette: 'omelette', tortitas: 'pancakes',
  bowl: 'bowl', cuscus: 'couscous', quesadilla: 'quesadilla', wrap: 'wrap', wraps: 'wrap',
  tosta: 'toast', tostada: 'toast', batido: 'smoothie', hamburguesa: 'burger',
  hamburguesas: 'burger', brochetas: 'skewers',
  espinacas: 'spinach', brocoli: 'broccoli', patata: 'potato', patatas: 'potatoes',
  pure: 'mashed potato', tomate: 'tomato', feta: 'feta', queso: 'cheese', champinones: 'mushrooms',
  champinon: 'mushroom', coco: 'coconut', maiz: 'corn', guisantes: 'peas', aguacate: 'avocado',
  avena: 'oatmeal', platano: 'banana', fruta: 'fruit', col: 'cabbage', verduras: 'vegetables',
  ajo: 'garlic', ajillo: 'garlic', limon: 'lemon', mostaza: 'mustard', albahaca: 'basil', kwark: 'yogurt',
  soja: 'soy', cebolla: 'onion', pimiento: 'pepper', agridulce: 'sweet and sour',
  frito: 'fried', salteado: 'stir fry', saltado: 'stir fry', empanado: 'breaded',
  revueltos: 'scrambled', revuelto: 'scrambled', rellenos: 'stuffed', cesar: 'caesar',
  griego: 'greek', tailandes: 'thai', turco: 'turkish',
}
const STOP = new Set(['de', 'del', 'con', 'y', 'en', 'al', 'a', 'la', 'el', 'los', 'las',
  'por', 'para', 'sin', 'e', 'o', 'un', 'una', 'blancas', 'blanca', 'negro', 'negra',
  'oriental', 'casero', 'casera', 'caseros', 'caseras', 'rapido', 'rapida', 'proteica',
  'proteico', 'ahumada', 'cocido', 'bote', 'estilo', 'verdes', 'plancha', 'fresca',
  'fresco', 'especiado', 'desmechado', 'picada', 'picante', 'espanola', 'perla',
  'krapow', 'goreng', 'pao', 'sis', 'jjigae', 'leche'])

// Devuelve { query, primary, keywords } o null si no se traduce nada útil.
// primary = plato distintivo si lo hay; si no, el primer ingrediente traducido.
function analyze(nombre) {
  const raw = deaccent(nombre).toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean)
  const kws = []
  let dish = null, firstIng = null
  for (const t of raw) {
    if (STOP.has(t)) continue
    const en = DISH[t] || LEX[t]
    if (!en) continue
    for (const w of en.split(' ')) if (!kws.includes(w)) kws.push(w)
    if (DISH[t] && !dish) dish = en
    if (!firstIng) firstIng = en
  }
  const primary = dish || firstIng
  if (!primary) return null
  return { query: `${kws.join(' ')} food`, primary, keywords: kws }
}

async function candidates(query) {
  const url = `https://api.unsplash.com/search/photos?per_page=10&orientation=landscape&content_filter=high&query=${encodeURIComponent(query)}`
  const res = await fetch(url, { headers: { Authorization: `Client-ID ${KEY}` } })
  if (res.status === 403) throw new Error('RATE_LIMIT')
  if (!res.ok) throw new Error(`Unsplash ${res.status}`)
  return (await res.json()).results || []
}

const meta = (p) => deaccent([
  p.description, p.alt_description, ...(p.tags || []).map((t) => t.title),
].filter(Boolean).join(' ').toLowerCase()).replace(/[-_]/g, ' ')

// Elige la mejor foto: debe contener el término principal; puntúa por keywords
// extra; descarta las ya usadas. Devuelve null si ninguna es relevante.
function pick(cands, { primary, keywords }, used) {
  let best = null, bestScore = 0
  for (const p of cands) {
    if (used.has(p.id)) continue
    const m = meta(p)
    if (!m.includes(primary)) continue
    const score = 1 + keywords.filter((k) => k !== primary && m.includes(k)).length
    if (score > bestScore) { best = p; bestScore = score }
  }
  return best
}

const used = new Set()
for (const r of await sql`SELECT imagen FROM recetas WHERE imagen IS NOT NULL`) {
  const m = r.imagen.match(/photo-[a-z0-9-]+/i)
  if (m) used.add(m[0].replace('photo-', ''))
}

// Prioridad: ids forzados al frente (--priority), luego disponibles con la
// despensa (faltan 0), luego por nº de ingredientes que faltan, luego alfabético.
// --only <ids> restringe a esos ids (para reprocesar recetas concretas).
const arg = (flag) => { const i = process.argv.indexOf(flag); return i >= 0 ? process.argv[i + 1] : null }
const onlyIds = arg('--only')?.split(',').map((s) => s.trim()).filter(Boolean) ?? null
const priorityIds = new Set((arg('--priority')?.split(',').map((s) => s.trim()) ?? []).filter(Boolean))

const [estado] = await sql`SELECT despensa FROM app_estado WHERE id = 1`
const despensa = estado?.despensa ?? []
let rows = (await sql`SELECT id, nombre, ingredientes FROM recetas WHERE imagen IS NULL`)
  .map((r) => ({ ...r, faltan: faltan(r, despensa) }))
if (onlyIds) rows = rows.filter((r) => onlyIds.includes(r.id))
rows.sort((a, b) =>
  (priorityIds.has(b.id) ? 1 : 0) - (priorityIds.has(a.id) ? 1 : 0)
  || a.faltan - b.faltan || a.nombre.localeCompare(b.nombre))
console.log(`Pendientes: ${rows.length} | disponibles (faltan 0): ${rows.filter((r) => r.faltan === 0).length}`)

if (process.argv.includes('--analyze')) {
  let n = 0
  for (const r of rows) {
    const a = analyze(r.nombre)
    if (a) { n++; console.log(`  [${a.primary}]  ${r.nombre}  ->  "${a.query}"`) }
    else console.log(`   NULL  ${r.nombre}`)
  }
  console.log(`\ntraducidas: ${n} | sin traducir: ${rows.length - n}`)
  process.exit(0)
}

const map = []
let done = 0, skipped = 0
for (const r of rows) {
  const a = analyze(r.nombre)
  if (!a) { console.log(`  · sin traducir (watermark): ${r.nombre}`); skipped++; continue }
  try {
    const photo = pick(await candidates(a.query), a, used)
    if (!photo) { console.log(`  · sin match relevante (watermark): ${r.nombre}  [q="${a.query}"]`); skipped++; }
    else {
      used.add(photo.id)
      const img = photo.urls.raw + RENDER
      map.push({ id: r.id, nombre: r.nombre, query: a.query, primary: a.primary, imagen: img })
      if (!DRY) await sql`UPDATE recetas SET imagen = ${img} WHERE id = ${r.id}`
      done++
      console.log(`  ✓ ${r.nombre}  [${a.primary}]`)
    }
  } catch (e) {
    if (e.message === 'RATE_LIMIT') { console.log(`\nRate limit tras ${done}. Relanza en ~1h.`); break }
    console.log(`  ! error ${r.nombre}: ${e.message}`)
  }
  await new Promise((s) => setTimeout(s, 200))
}

writeFileSync(resolve(__dirname, 'image-map.json'), JSON.stringify(map, null, 2))
console.log(`\n${DRY ? '[DRY] ' : ''}Actualizadas: ${done} | watermark: ${skipped} | mapa -> scripts/image-map.json`)
