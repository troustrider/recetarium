#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const RUTA = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'precios.json')
const UNIDADES = ['g', 'kg', 'ml', 'cl', 'l', 'ud']

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase().replace(/\s+/g, ' ')

function leer() {
  return JSON.parse(readFileSync(RUTA, 'utf8'))
}

function guardar(datos) {
  datos.meta.actualizado = new Date().toISOString().slice(0, 7)
  writeFileSync(RUTA, `${JSON.stringify(datos, null, 2)}\n`, 'utf8')
}

function salir(mensaje) {
  console.error(`\n  ${mensaje}\n`)
  process.exit(1)
}

const args = process.argv.slice(2)

if (args.includes('--listar-sin-contrastar')) {
  const { precios } = leer()
  const pendientes = precios.filter((p) => p.fuente === 'estimado')
  console.log(`\n${pendientes.length} de ${precios.length} entradas sin contrastar en tienda:\n`)
  for (const p of pendientes) console.log(`  ${p.nombre.padEnd(30)} ${p.euros} €/${p.unidad}`)
  console.log('\nContrasta primero las que más pesan: npm run test:server\n')
  process.exit(0)
}

const nueva = args.includes('--nueva')
const [nombre, euros, unidad, cadena, formato] = args.filter((a) => a !== '--nueva')

if (!nombre || !euros || !unidad || !cadena) {
  salir('uso: npm run precio -- "<nombre>" <euros> <unidad> <cadena> ["formato"]')
}

const importe = Number(String(euros).replace(',', '.'))
if (!Number.isFinite(importe) || importe <= 0) salir(`precio inválido: ${euros}`)
if (!UNIDADES.includes(unidad)) salir(`unidad inválida: ${unidad}. Usa una de: ${UNIDADES.join(', ')}`)

const datos = leer()
const entrada = datos.precios.find((p) => norm(p.nombre) === norm(nombre))

if (!entrada && !nueva) {
  const cabeza = norm(nombre).split(' ')[0]
  const parecidos = datos.precios
    .filter((p) => norm(p.nombre).includes(cabeza))
    .map((p) => p.nombre)
    .slice(0, 5)
  salir(
    `no existe "${nombre}".` +
      (parecidos.length ? ` ¿Querías uno de estos?\n    ${parecidos.join('\n    ')}` : '') +
      '\n  Si es un ingrediente nuevo, añade --nueva.'
  )
}

if (entrada) {
  const cambio = Math.abs(importe - entrada.euros) / entrada.euros
  const antes = `${entrada.euros} €/${entrada.unidad} (${entrada.fuente})`
  entrada.euros = importe
  entrada.unidad = unidad
  entrada.fuente = cadena
  entrada.revisado = new Date().toISOString().slice(0, 7)
  if (formato) entrada.formato = formato
  guardar(datos)
  console.log(`\n  ${entrada.nombre}: ${antes} → ${importe} €/${unidad} (${cadena})`)
  if (cambio > 0.5) console.log(`  ojo: cambia un ${(100 * cambio).toFixed(0)}%. Si es un dedazo, vuelve a lanzarlo.`)
  console.log()
} else {
  datos.precios.push({
    nombre,
    euros: importe,
    unidad,
    fuente: cadena,
    revisado: new Date().toISOString().slice(0, 7),
    ...(formato ? { formato } : {}),
  })
  guardar(datos)
  console.log(`\n  nueva entrada: ${nombre} a ${importe} €/${unidad} (${cadena})\n`)
}
