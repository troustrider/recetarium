import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'

const SP = (process.env.TANDA_DIR || `${tmpdir()}/recetarium-tanda`)
const fichero = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'scripts/candidatos.json'
const cand = JSON.parse(readFileSync(fichero, 'utf8')).filter((r) => r.cands.length)

const UA = 'recetarium/1.0 (https://github.com/troustrider/recetarium; akarim1398@gmail.com)'
const pausa = (ms) => new Promise((r) => setTimeout(r, ms))

async function bajar(url) {
  for (let i = 0; i < 4; i++) {
    await pausa(250 * (i + 1))
    const res = await fetch(url, { headers: { 'User-Agent': UA } })
    if (res.ok && (res.headers.get('content-type') || '').startsWith('image/')) {
      return Buffer.from(await res.arrayBuffer())
    }
  }
  return null
}

const arg = (f) => { const i = process.argv.indexOf(f); return i >= 0 ? process.argv[i + 1] : null }
const porReceta = Number(arg('--cands') || 3)
const grupo = Number(arg('--grupo') || 4)

rmSync(SP + '/tanda', { recursive: true, force: true })
const idx = []
let g = 0
for (let i = 0; i < cand.length; i += grupo) {
  const bloque = cand.slice(i, i + grupo)
  const dir = `${SP}/tanda/g${String(g).padStart(2, '0')}`
  mkdirSync(dir, { recursive: true })
  for (const [j, r] of bloque.entries()) {
    const letra = 'ABCDEFGH'[j]
    for (const [k, c] of r.cands.slice(0, porReceta).entries()) {
      const url = c.raw + (c.raw.includes('?') ? '&' : '?') + 'w=300&h=225&q=70&fit=crop&crop=entropy'
      const buf = await bajar(url)
      if (buf) writeFileSync(`${dir}/${letra}${k + 1}.jpg`, buf)
      else console.log(`  ! sin bajar ${letra}${k + 1} de ${r.nombre}`)
    }
    idx.push({ grupo: g, letra, id: r.id, nombre: r.nombre, query: r.query,
      cands: r.cands.slice(0, porReceta).map((c) => ({ id: c.id, raw: c.raw, ok: c.ok })) })
  }
  g++
}
writeFileSync(SP + '/tanda/indice.json', JSON.stringify(idx, null, 2))
for (const e of idx) console.log(`g${String(e.grupo).padStart(2, '0')} ${e.letra}  ${e.nombre}`)
console.log(`\n${idx.length} recetas en ${g} grupos`)
