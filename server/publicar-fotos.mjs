import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { neon } from '@neondatabase/serverless'
import { tmpdir } from 'node:os'

for (const l of readFileSync('.env', 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const sql = neon(process.env.DATABASE_URL)
const UA = 'recetarium/1.0 (https://github.com/troustrider/recetarium; akarim1398@gmail.com)'
const TMP = `${tmpdir()}/recetarium-fotos`
const DESTINO = '../public/fotos'
const DRY = process.argv.includes('--dry')
mkdirSync(TMP, { recursive: true })
mkdirSync(DESTINO, { recursive: true })

const pausa = (ms) => new Promise((r) => setTimeout(r, ms))
const EXTRA = { ø: 'o', æ: 'ae', å: 'a', ß: 'ss', đ: 'd', ı: 'i', ł: 'l' }
const slug = (s) => s.toLowerCase().replace(/[øæåßđıł]/g, (c) => EXTRA[c])
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

async function bajar(url, destino) {
  for (let i = 0; i < 4; i++) {
    await pausa(300 * (i + 1))
    const res = await fetch(url, { headers: { 'User-Agent': UA } })
    if (res.ok && (res.headers.get('content-type') || '').startsWith('image/')) {
      writeFileSync(destino, Buffer.from(await res.arrayBuffer()))
      return true
    }
  }
  return false
}

const seleccion = JSON.parse(readFileSync(process.argv[2], 'utf8'))
const CRED = 'scripts/image-credits.json'
const creditos = existsSync(CRED) ? JSON.parse(readFileSync(CRED, 'utf8')) : {}
let hechas = 0

for (const [nombre, sel] of Object.entries(seleccion)) {
  const s = slug(nombre)
  const bruto = `${TMP}/${s}-bruto.jpg`
  if (!(await bajar(sel.url, bruto))) { console.log(`  ! no baja ${nombre}`); continue }
  const salida = `${DESTINO}/${s}.jpg`
  const args = ['-NoProfile', '-File', 'mejorar-foto.ps1', '-In', bruto, '-Out', salida]
  if (sel.zoom) args.push('-Zoom', String(sel.zoom))
  if (sel.sat) args.push('-Sat', String(sel.sat))
  if (sel.con) args.push('-Con', String(sel.con))
  if (sel.bri) args.push('-Bri', String(sel.bri))
  const linea = execFileSync('powershell', args, { encoding: 'utf8' }).trim()
  unlinkSync(bruto)
  const publica = `/fotos/${s}.jpg`
  if (!DRY) {
    await sql`UPDATE recetas SET imagen = ${publica} WHERE nombre = ${nombre} AND borrada_en IS NULL`
    creditos[nombre] = { ...sel.credito, url: publica, original: sel.url, recortada: true }
  }
  hechas++
  console.log(`  ✓ ${nombre.padEnd(36)} ${linea}`)
}
if (!DRY) writeFileSync(CRED, JSON.stringify(creditos, null, 2))
const [n] = await sql`SELECT COUNT(*)::int c FROM recetas WHERE imagen IS NULL AND borrada_en IS NULL`
console.log(`\n${DRY ? '[DRY] ' : ''}publicadas: ${hechas} | sin foto: ${n.c}`)
