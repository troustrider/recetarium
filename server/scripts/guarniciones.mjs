/**
 * Catálogo de guarniciones: crea las tablas, vuelca `server/src/data/guarniciones.json`
 * y reparte opciones a cada principal.
 *
 *   node --env-file=.env scripts/guarniciones.mjs plan      # enseña el reparto, no escribe
 *   node --env-file=.env scripts/guarniciones.mjs migrar    # DDL + catálogo + reparto
 *   node --env-file=.env scripts/guarniciones.mjs catalogo  # solo re-vuelca el catálogo
 *
 * Se ejecuta desde `server/`.
 */
import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { neon } from '@neondatabase/serverless'
import { norm, estimarMacros, fichaNutricional } from '../src/lib/nutricion.js'
import {
  CATALOGO,
  FAMILIA_DE_COCINA,
  esAlmidonDeCuerpo,
  esVerdura,
  compatibleConCocina as compatible,
} from '../src/lib/guarniciones.js'

const AQUI = dirname(fileURLToPath(import.meta.url))
const sql = neon(process.env.DATABASE_URL)

const IMPLICITO = new Set(['sal', 'pimienta', 'agua', 'aceite de oliva', 'aceite de girasol', 'vinagre', 'vinagre de arroz', 'vinagre de vino tinto', 'azúcar', 'limón', 'lima', 'ajo'])

const red1 = (n) => Math.round(n * 10) / 10

function fichaDe(guarnicion) {
  const entrada = { ingredientes: guarnicion.ingredientes, porciones: 2 }
  const macros = estimarMacros(entrada)
  const ficha = fichaNutricional(entrada)
  return {
    calorias: Math.round(macros.calorias),
    proteinas: red1(macros.proteinas),
    carbohidratos: red1(macros.carbohidratos),
    grasas: red1(macros.grasas),
    hierro: ficha.hierro,
    sinGluten: ficha.sinGluten,
    micros: ficha.micros,
    apto: ficha.apto,
  }
}

// Una guarnición que nombra la cocina exacta manda sobre la que solo encaja por
// familia, y esa sobre la global. Sin esto, el arroz blanco (global) se colaría
// por delante del sunomono en un plato japonés.
function especificidad(guarnicion, cocina) {
  if (guarnicion.cocinas.includes(cocina)) return 0
  if (guarnicion.cocinas.some((c) => (FAMILIA_DE_COCINA[cocina] ?? []).includes(c) && c !== 'global')) return 1
  return 2
}

const nucleoDe = (ingredientes) =>
  new Set(ingredientes.filter((i) => !IMPLICITO.has(norm(i.nombre))).map((i) => norm(i.nombre)))

function perfilPlato(receta) {
  const ingredientes = receta.ingredientes ?? []
  const verdura = ingredientes.some(esVerdura)
  const almidon = ingredientes.some(esAlmidonDeCuerpo)
  return { verdura, almidon, nucleo: nucleoDe(ingredientes) }
}

const aportaVerdura = (g) => g.aporta.includes('verdura')
const aportaAlmidon = (g) => g.aporta.includes('almidon')

/**
 * Reparte hasta tres opciones. La primera es la recomendada: la que el
 * planificador enciende solo. El orden lo manda lo que le falta al plato.
 */
export function opcionesPara(receta, catalogo = CATALOGO.guarniciones) {
  if (receta.tipo !== 'principal') return []
  const plato = perfilPlato(receta)

  // Choca solo si el plato ya trae la protagonista de la guarnición, que va
  // siempre la primera de su lista. Compartir el tomate de una ensalada con el
  // sofrito del guiso no es repetir; poner brócoli sobre un plato de brócoli sí.
  const choca = (g) => plato.nucleo.has(norm(g.ingredientes[0].nombre))

  const compatibles = catalogo.filter((g) => compatible(g, receta.categoria))
  const sinAlmidonSobrante = compatibles.filter((g) => !(plato.almidon && aportaAlmidon(g)))
  // Si el eco de un ingrediente deja al plato sin ninguna opción, pesa más
  // ofrecer algo que no repetirse: un lagman con pimiento se queda sin ensalada
  // solo porque la ensalada también lleva tomate.
  const pool = sinAlmidonSobrante.filter((g) => !choca(g)).length
    ? sinAlmidonSobrante.filter((g) => !choca(g))
    : sinAlmidonSobrante

  // Rotación estable por receta: dos platos turcos consecutivos no se llevan la
  // misma ensalada solo porque el catálogo la liste antes.
  let semilla = 0
  for (const ch of receta.id ?? receta.nombre) semilla = (semilla * 31 + ch.charCodeAt(0)) >>> 0
  const rotado = (lista) => lista.map((g, i) => ({ g, k: (i + semilla) % lista.length }))
    .sort((a, b) => especificidad(a.g, receta.categoria) - especificidad(b.g, receta.categoria) || a.k - b.k)
    .map((x) => x.g)

  // Un plato sin verdura propia se queda con la suya aunque el eco de un
  // ingrediente la hubiera descartado: comer verdura pesa más que no repetirse.
  const verduras = rotado(
    pool.filter(aportaVerdura).length || plato.verdura
      ? pool.filter(aportaVerdura)
      : compatibles.filter(aportaVerdura)
  )
  const almidones = rotado(pool.filter((g) => aportaAlmidon(g) && !aportaVerdura(g)))
  const proteinas = rotado(pool.filter((g) => g.aporta.includes('proteina') && !aportaVerdura(g) && !aportaAlmidon(g)))

  const elegidas = []
  const meter = (g) => { if (g && !elegidas.includes(g) && elegidas.length < 3) elegidas.push(g) }

  if (!plato.verdura) {
    // Sin verdura propia, la verdura va primero y no es negociable.
    meter(verduras[0])
    if (!plato.almidon) meter(almidones[0])
    meter(verduras[1])
  } else {
    if (!plato.almidon) meter(almidones[0])
    meter(verduras[0])
    meter(verduras[1])
  }
  meter(proteinas[0])
  meter(almidones[1])

  // Sin gluten: si el plato lo es, la recomendada tiene que serlo también, o el
  // filtro del catálogo enseña una receta limpia con pan de pita encendido.
  if (receta.sinGluten === true && elegidas.length > 1) {
    const limpia = elegidas.findIndex((g) => fichaDe(g).sinGluten === true)
    if (limpia > 0) elegidas.unshift(...elegidas.splice(limpia, 1))
  }

  return elegidas
}

async function leerRecetas() {
  return sql`
    SELECT r.id, r.nombre, r.categoria, r.tipo, r.ingredientes, r.sin_gluten AS "sinGluten", r.guarnicion
    FROM recetas r WHERE r.borrada_en IS NULL ORDER BY r.nombre`
}

async function ddl() {
  const ruta = resolve(AQUI, '../../sql/2026-09-guarniciones-catalogo.sql')
  // Los comentarios fuera antes de trocear: uno de ellos lleva punto y coma y
  // partía una sentencia por la mitad.
  const limpio = readFileSync(ruta, 'utf8').replace(/^\s*--.*$/gm, '')
  for (const sentencia of limpio.split(';').map((s) => s.trim()).filter(Boolean))
    await sql.query(sentencia)
  console.log('tablas listas')
}

async function volcarCatalogo() {
  for (const g of CATALOGO.guarniciones) {
    const f = fichaDe(g)
    await sql`
      INSERT INTO guarniciones (nombre, ingredientes, pasos, cocinas, aporta,
        calorias, proteinas, carbohidratos, grasas, hierro, sin_gluten, micros, apto)
      VALUES (${g.nombre}, ${JSON.stringify(g.ingredientes)}, ${JSON.stringify(g.pasos)},
        ${g.cocinas}, ${g.aporta},
        ${f.calorias}, ${f.proteinas}, ${f.carbohidratos}, ${f.grasas},
        ${f.hierro}, ${f.sinGluten}, ${JSON.stringify(f.micros)}, ${JSON.stringify(f.apto)})
      ON CONFLICT (nombre) WHERE hogar_id IS NULL AND borrada_en IS NULL DO UPDATE SET
        ingredientes = EXCLUDED.ingredientes, pasos = EXCLUDED.pasos,
        cocinas = EXCLUDED.cocinas, aporta = EXCLUDED.aporta,
        calorias = EXCLUDED.calorias, proteinas = EXCLUDED.proteinas,
        carbohidratos = EXCLUDED.carbohidratos, grasas = EXCLUDED.grasas,
        hierro = EXCLUDED.hierro, sin_gluten = EXCLUDED.sin_gluten,
        micros = EXCLUDED.micros, apto = EXCLUDED.apto`
  }
  console.log(`catálogo volcado: ${CATALOGO.guarniciones.length} guarniciones`)
}

async function repartir() {
  const recetas = await leerRecetas()
  const filas = await sql`SELECT id, nombre FROM guarniciones WHERE hogar_id IS NULL AND borrada_en IS NULL`
  const idDe = new Map(filas.map((f) => [f.nombre, f.id]))

  let escritas = 0
  for (const receta of recetas) {
    const opciones = opcionesPara(receta)
    if (!opciones.length) continue
    await sql`DELETE FROM receta_guarniciones WHERE receta_id = ${receta.id}`
    for (const [orden, g] of opciones.entries())
      await sql`
        INSERT INTO receta_guarniciones (receta_id, guarnicion_id, orden)
        VALUES (${receta.id}, ${idDe.get(g.nombre)}, ${orden})
        ON CONFLICT (receta_id, guarnicion_id) DO UPDATE SET orden = EXCLUDED.orden`
    escritas++
  }
  console.log(`repartidas guarniciones en ${escritas} recetas`)
}

async function plan() {
  const recetas = await leerRecetas()
  const principales = recetas.filter((r) => r.tipo === 'principal')
  const cuenta = { 0: 0, 1: 0, 2: 0, 3: 0 }
  const usos = new Map()
  const sinVerdura = []
  for (const r of principales) {
    const ops = opcionesPara(r)
    cuenta[ops.length]++
    for (const g of ops) usos.set(g.nombre, (usos.get(g.nombre) ?? 0) + 1)
    const plato = perfilPlato(r)
    if (!plato.verdura && !ops.some(aportaVerdura)) sinVerdura.push(`${r.nombre} [${r.categoria}]`)
  }
  console.log(`principales: ${principales.length}`)
  console.log(`opciones por receta -> 0: ${cuenta[0]}, 1: ${cuenta[1]}, 2: ${cuenta[2]}, 3: ${cuenta[3]}`)
  console.log(`guarniciones usadas: ${usos.size} de ${CATALOGO.guarniciones.length}`)
  const top = [...usos].sort((a, b) => b[1] - a[1]).slice(0, 12)
  console.log('más repetidas: ' + top.map(([n, c]) => `${n} (${c})`).join(', '))
  const nunca = CATALOGO.guarniciones.filter((g) => !usos.has(g.nombre)).map((g) => g.nombre)
  if (nunca.length) console.log('sin usar: ' + nunca.join(', '))
  if (sinVerdura.length) {
    console.log(`\nSIN VERDURA NI EN PLATO NI EN OPCIONES (${sinVerdura.length}):`)
    sinVerdura.forEach((n) => console.log('  ' + n))
  }
}

// Solo despacha cuando se ejecuta como script; los tests importan `opcionesPara`.
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const comando = process.argv[2]
  if (comando === 'plan') await plan()
  else if (comando === 'catalogo') { await ddl(); await volcarCatalogo() }
  else if (comando === 'migrar') { await ddl(); await volcarCatalogo(); await repartir() }
  else {
    console.error('uso: guarniciones.mjs plan | catalogo | migrar')
    process.exit(1)
  }
}
