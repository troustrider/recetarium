import { readFileSync, writeFileSync } from 'node:fs'
import { neon } from '@neondatabase/serverless'

for (const l of readFileSync('.env', 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const sql = neon(process.env.DATABASE_URL)
const UA = 'recetarium/1.0 (https://github.com/troustrider/recetarium; akarim1398@gmail.com)'
const api = async (url) => (await fetch(url, { headers: { 'User-Agent': UA } })).json()

const IMG = /\.(jpe?g|png)$/i
const ficha = (info, titulo) => ({
  id: titulo,
  raw: info.thumburl || info.url,
  txt: titulo.replace(/^File:/, '').slice(0, 80),
  credito: {
    fichero: titulo,
    autor: (info.extmetadata?.Artist?.value || '').replace(/<[^>]*>/g, '').trim().slice(0, 120),
    licencia: info.extmetadata?.LicenseShortName?.value || '',
    pagina: info.descriptionurl || '',
  },
})

async function detalle(ficheros) {
  if (!ficheros.length) return []
  const url = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo'
    + '&iiprop=url|extmetadata|mime&iiurlwidth=900&titles=' + encodeURIComponent(ficheros.join('|'))
  const paginas = Object.values((await api(url)).query?.pages || {})
  return paginas.flatMap((p) => {
    const info = p.imageinfo?.[0]
    if (!info || !IMG.test(p.title)) return []
    return [ficha(info, p.title)]
  })
}

async function principal(lang, titulo) {
  const url = `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&redirects=1`
    + `&prop=images&imlimit=25&titles=${encodeURIComponent(titulo)}`
  const paginas = Object.values((await api(url)).query?.pages || {})
  const ficheros = paginas.flatMap((p) => (p.images || []).map((i) => i.title))
    .filter((t) => IMG.test(t) && !/logo|icon|flag|map|symbol|commons|wiki|edit|question/i.test(t))
  return ficheros.slice(0, 6)
}

async function enCommons(termino) {
  const url = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search'
    + '&gsrnamespace=6&gsrlimit=8&gsrsearch=' + encodeURIComponent(`filetype:bitmap ${termino}`)
  const paginas = Object.values((await api(url)).query?.pages || {})
  return paginas.map((p) => p.title).filter((t) => IMG.test(t)).slice(0, 6)
}

const arg = (f) => { const i = process.argv.indexOf(f); return i >= 0 ? process.argv[i + 1] : null }
const titulos = JSON.parse(readFileSync(arg('--titulos') || 'scripts/titulos-wiki.json', 'utf8'))
const pendientes = await sql`SELECT id, nombre FROM recetas WHERE imagen IS NULL AND borrada_en IS NULL`
const salida = []
for (const r of pendientes) {
  const plan = titulos[r.nombre]
  if (!plan) continue
  const ficheros = []
  for (const [lang, titulo] of plan) {
    for (const f of await principal(lang, titulo)) if (!ficheros.includes(f)) ficheros.push(f)
    if (ficheros.length >= 6) break
  }
  if (ficheros.length < 4) {
    for (const f of await enCommons(plan[0][1])) if (!ficheros.includes(f)) ficheros.push(f)
  }
  const cands = (await detalle(ficheros.slice(0, 8))).slice(0, 4)
  salida.push({ id: r.id, nombre: r.nombre, query: plan.map((p) => p.join(':')).join(' | '), cands })
  console.log(`${r.nombre.padEnd(36)} ${String(cands.length).padStart(2)}`)
}
writeFileSync(arg('--salida') || 'scripts/candidatos-wiki.json', JSON.stringify(salida, null, 2))
console.log(`\n${salida.length} recetas`)
