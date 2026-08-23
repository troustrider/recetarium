import { readFileSync } from 'node:fs'
import { precioDe } from '../src/utils/precios'

const fichero = process.argv[2]
if (!fichero) {
  console.error('uso: npx vite-node scripts/precio-lote.ts <lote.json>')
  process.exit(1)
}

const lote = JSON.parse(readFileSync(fichero, 'utf8'))

for (const r of lote) {
  let total = 0
  const sinPrecio: string[] = []
  for (const i of [...r.ingredientes, ...(r.guarnicion?.ingredientes ?? [])]) {
    const p = precioDe(i)
    if (p === null) sinPrecio.push(i.nombre)
    else total += p
  }
  const porcion = total / (r.porciones ?? 2)
  const marca = Math.abs(porcion - (r.precioPorPorcion ?? 0)) > 0.35 ? '  <-- AJUSTAR' : ''
  console.log(
    `${porcion.toFixed(2).padStart(5)}  declarado ${String(r.precioPorPorcion ?? '-').padStart(5)}  ${r.nombre}` +
      (sinPrecio.length ? `  [sin precio: ${sinPrecio.join(', ')}]` : '') +
      marca
  )
  if (process.argv.includes('--write')) r.precioPorPorcion = Math.round(porcion * 100) / 100
}

if (process.argv.includes('--write')) {
  const { writeFileSync } = await import('node:fs')
  writeFileSync(fichero, JSON.stringify(lote, null, 2) + String.fromCharCode(10))
}
