// Herramienta de mantenimiento del recetario para la skill chef-recetarium.
//
//   node scripts/chef-recetas.mjs audit                 -> audita toda la BD contra las puertas de calidad
//   node scripts/chef-recetas.mjs check <fichero.json>  -> valida un lote sin escribir
//   node scripts/chef-recetas.mjs apply <fichero.json>  -> valida y escribe (UPDATE si trae id, INSERT si no)
//
// El UPDATE no toca favorita ni imagen, al contrario que el PUT de la API.

import 'dotenv/config'
import { readFileSync, writeFileSync } from 'node:fs'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const SABORES = ['salado', 'dulce', 'amargo', 'umami', 'acido']
const TIPOS = ['principal', 'postre', 'desayuno', 'entrante']
const FAMILIAS = ['verduras', 'frutas', 'carnes', 'pescados', 'lácteos', 'huevos', 'cereales',
  'legumbres', 'frutos secos', 'conservas', 'especias', 'condimentos', 'salsas', 'bebidas', 'otros']
const UNIDADES = ['g', 'ml', 'ud', 'vaso', 'cucharada', 'cucharadita', 'diente', 'hoja', 'loncha',
  'rodaja', 'rebanada', 'puñado', 'pizca', 'gota', 'tira', 'lata', 'paquete']

const RE_TIEMPO = /\d+\s*(?:-\s*\d+\s*)?(?:min\b|minutos?\b|s\b|segundos?\b|h\b|horas?\b)/i
const RE_TEMP = /\d+\s*°C/
const RE_SENAL = /hasta |cuando |sin que |antes de que |al momento en que /i
// El \b final evita que "marinada" o "asado" se lean como el verbo en imperativo.
const VERBOS = /\b(cuece|cuécelo|hierve|hornea|asa|ásalo|fríe|sofríe|saltea|dora|dóralo|reduce|marina|reposa|pocha|glasea|tuesta|escalda|cuaja)\b/i
const RE_VAGO = /\b(un poco de|un chorro|un chorrito|unas gotas|al gusto|algo de|un buen punado|suficiente|la cantidad necesaria|unos minutos|un rato|un vaso de agua)\b/
// Cantidad escalable escrita en el paso sin marcar entre llaves. Excluye tiempos,
// temperaturas y tamaños de utensilio, que nunca deben escalar.
const RE_SIN_MARCAR = /\b\d+(?:[.,]\d+)?\s*(?:g|ml|kg|l|cucharadas?|cucharaditas?|dientes?|vasos?|rebanadas?|lonchas?|rodajas?|latas?|paquetes?|puñados?)\b/i
const sinLlaves = (p) => p.replace(/\{[^}]*\}/g, ' ')

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

// Palabras vacías al buscar un ingrediente dentro de los pasos.
const STOP = new Set(['de', 'del', 'la', 'el', 'en', 'con', 'y', 'al', 'a', 'para', 'los', 'las'])
const IMPLICITOS = new Set(['sal', 'pimienta', 'agua'])

function nucleo(nombre) {
  return norm(nombre).split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w))
}

export function validar(r, { estricto = true } = {}) {
  const e = []
  const w = []

  if (!r.nombre?.trim()) e.push('nombre vacío')
  if (!SABORES.includes(r.sabor)) e.push(`sabor inválido: ${r.sabor}`)
  if (r.tipo && !TIPOS.includes(r.tipo)) e.push(`tipo inválido: ${r.tipo}`)
  if (r.categoria && r.categoria !== norm(r.categoria)) e.push(`categoria con mayúsculas o acentos: ${r.categoria}`)
  if (!(r.tiempoPreparacion > 0)) e.push('tiempoPreparacion debe ser > 0')
  if (!(r.precioPorPorcion > 0)) e.push('precioPorPorcion debe ser > 0')
  if (!(r.porciones > 0)) e.push('porciones debe ser > 0')
  // El escalado de la app parte de 2 comensales (BASE_COMENSALES en DetalleReceta).
  if (estricto && r.porciones !== 2)
    e.push(`porciones = ${r.porciones}; el estándar es 2 y la app escala desde ahí`)

  if (!Array.isArray(r.ingredientes) || !r.ingredientes.length) e.push('sin ingredientes')
  else
    r.ingredientes.forEach((i, n) => {
      if (!i.nombre?.trim()) e.push(`ingrediente ${n}: sin nombre`)
      if (!(i.cantidad > 0)) e.push(`ingrediente ${n} (${i.nombre}): cantidad inválida`)
      if (!UNIDADES.includes(i.unidad)) e.push(`ingrediente ${n} (${i.nombre}): unidad "${i.unidad}" no canónica`)
      if (!FAMILIAS.includes(i.familia)) e.push(`ingrediente ${n} (${i.nombre}): familia "${i.familia}" no válida`)
      if (i.nombre !== i.nombre?.toLowerCase()) w.push(`ingrediente "${i.nombre}" no está en minúsculas`)
    })

  if (!Array.isArray(r.pasos) || !r.pasos.length) e.push('sin pasos')

  // --- puertas de calidad ---
  if (Array.isArray(r.pasos) && r.pasos.length) {
    const minPasos = r.tipo === 'principal' ? 5 : 4
    if (r.pasos.length < minPasos) e.push(`solo ${r.pasos.length} pasos (mínimo ${minPasos} para ${r.tipo ?? 'principal'})`)

    // Un bol de yogur no tiene tres cocciones que cronometrar. El mínimo baja en los
    // platos de montaje en frío, donde exigir tres tiempos obligaría a inventarlos.
    const cocinados = r.pasos.filter((p) => VERBOS.test(p.replace(/mientras[^,.]*[,.]/gi, ' '))).length
    const minTiempos = cocinados >= 2 ? 3 : 2
    const conTiempo = r.pasos.filter((p) => RE_TIEMPO.test(p)).length
    if (conTiempo < minTiempos) e.push(`solo ${conTiempo} paso(s) con duración parseable (mínimo ${minTiempos})`)

    r.pasos.forEach((p, n) => {
      // "mientras cuece el arroz, pica..." referencia una cocción de otro paso, no manda una nueva.
      const cuerpo = p.replace(/mientras[^,.]*[,.]/gi, ' ')
      if (VERBOS.test(cuerpo) && !RE_TIEMPO.test(p) && !RE_SENAL.test(p))
        e.push(`paso ${n + 1}: cocción sin duración ni señal de punto`)
      if (/segun el paquete/i.test(norm(p)) && !RE_TIEMPO.test(p))
        e.push(`paso ${n + 1}: "según el paquete" sin rango entre paréntesis`)
      const vago = norm(p).match(RE_VAGO)
      if (vago) e.push(`paso ${n + 1}: cuantificador vago "${vago[0].trim()}"`)
      const suelta = sinLlaves(p).match(RE_SIN_MARCAR)
      if (suelta) e.push(`paso ${n + 1}: cantidad "${suelta[0].trim()}" sin marcar entre llaves para escalado`)
      if (p.length < 40) e.push(`paso ${n + 1}: demasiado corto (${p.length} caracteres, mínimo 40)`)
      if (p.length > 400) w.push(`paso ${n + 1}: largo (${p.length} caracteres)`)
    })

    const texto = r.pasos.join(' ')
    if (/horno|hornea/i.test(texto) && !RE_TEMP.test(texto))
      e.push('usa el horno sin indicar temperatura en °C')

    // En cortes finos o carne deshecha, la señal visual sustituye legítimamente al termómetro.
    const RE_PUNTO_CARNE = /jugo salga transparente|(?:sin|no qued[ae]n?) (?:zonas? )?ro(?:sas?|jas?|sad[oa]s?)|sin que quede ro|se desha[gc]a al|se deshilache|se deshebre/i
    // La charcutería va curada o cocida de fábrica: no hay temperatura interna que alcanzar.
    const CURADOS = /jam[oó]n|spek|bacon|chorizo|panceta|pancetta|guanciale|salchich[oó]n|sobrasada|rookworst|lomo embuchado|cecina|salami|fuet/i
    const carne = (r.ingredientes ?? []).some((i) => i.familia === 'carnes' && !CURADOS.test(i.nombre))
    if (carne && !RE_TEMP.test(texto) && !RE_PUNTO_CARNE.test(texto))
      e.push('lleva carne y ningún paso da temperatura interna ni su señal equivalente')

    const ultimo = norm(r.pasos[r.pasos.length - 1])
    if (r.sabor !== 'dulce' && !/prueba|ajusta|rectifica/.test(ultimo))
      e.push('el último paso no manda probar y ajustar')
  }

  const nc = Array.isArray(r.consejos) ? r.consejos.length : 0
  if (nc < 3) e.push(`solo ${nc} consejo(s) (mínimo 3)`)
  if (nc > 5) w.push(`${nc} consejos (máximo recomendado 5)`)

  // --- coherencia ingredientes <-> pasos ---
  if (Array.isArray(r.ingredientes) && Array.isArray(r.pasos)) {
    const texto = norm(r.pasos.join(' ') + ' ' + (r.consejos || []).join(' '))
    for (const i of r.ingredientes) {
      if (IMPLICITOS.has(norm(i.nombre))) continue
      const palabras = nucleo(i.nombre)
      if (palabras.length && !palabras.some((p) => texto.includes(p.replace(/s$/, ''))))
        e.push(`"${i.nombre}" está en la lista pero no aparece en ningún paso`)
    }
  }

  // --- macros ---
  const { calorias: kcal, proteinas: p, carbohidratos: c, grasas: g } = r
  if ([kcal, p, c, g].every((x) => typeof x === 'number')) {
    const calc = p * 4 + c * 4 + g * 9
    const desvio = Math.abs(calc - kcal) / kcal
    if (desvio > 0.1) e.push(`macros incoherentes: ${p}P/${c}C/${g}G = ${Math.round(calc)} kcal, pero la ficha dice ${kcal}`)
  }
  if (estricto && r.tipo === 'principal' && typeof p === 'number' && p < 35)
    w.push(`principal con ${p} g de proteína (< 35)`)
  if (estricto && r.tipo === 'desayuno' && typeof p === 'number' && p < 25)
    w.push(`desayuno con ${p} g de proteína (< 25)`)

  if (r.precioPorPorcion > 4.5 || r.precioPorPorcion < 0.8)
    w.push(`precio ${r.precioPorPorcion} €/ración fuera del rango habitual 0,80-4,50`)

  return { errores: e, avisos: w }
}

async function categoryId(sabor) {
  const [row] = await sql`SELECT id FROM categories WHERE name = ${sabor}`
  if (!row) throw new Error(`sabor desconocido: ${sabor}`)
  return row.id
}

async function leerTodas() {
  return sql`
    SELECT r.id, r.nombre, r.categoria, c.name AS sabor, r.tiempo_preparacion AS "tiempoPreparacion",
           r.ingredientes, r.pasos, r.consejos, r.porciones, r.tipo,
           r.precio_por_porcion::float AS "precioPorPorcion", r.calorias,
           r.proteinas::float AS proteinas, r.carbohidratos::float AS carbohidratos, r.grasas::float AS grasas
    FROM recetas r JOIN categories c ON r.category_id = c.id ORDER BY r.nombre`
}

async function guardar(r) {
  const cid = await categoryId(r.sabor)
  const ing = JSON.stringify(r.ingredientes)
  const pas = JSON.stringify(r.pasos)
  const con = JSON.stringify(r.consejos ?? [])
  if (r.id) {
    const [row] = await sql`
      UPDATE recetas SET nombre = ${r.nombre}, categoria = ${r.categoria ?? null},
        tiempo_preparacion = ${r.tiempoPreparacion}, ingredientes = ${ing}, pasos = ${pas},
        consejos = ${con}, category_id = ${cid}, precio_por_porcion = ${r.precioPorPorcion},
        porciones = ${r.porciones}, calorias = ${r.calorias ?? null}, proteinas = ${r.proteinas ?? null},
        carbohidratos = ${r.carbohidratos ?? null}, grasas = ${r.grasas ?? null}, tipo = ${r.tipo ?? 'principal'}
      WHERE id = ${r.id} RETURNING id, nombre`
    if (!row) throw new Error(`id no encontrado: ${r.id}`)
    return { accion: 'UPDATE', ...row }
  }
  const [row] = await sql`
    INSERT INTO recetas (nombre, categoria, tiempo_preparacion, favorita, ingredientes, pasos, consejos,
      precio_por_porcion, porciones, category_id, calorias, proteinas, carbohidratos, grasas, tipo)
    VALUES (${r.nombre}, ${r.categoria ?? null}, ${r.tiempoPreparacion}, false, ${ing}, ${pas}, ${con},
      ${r.precioPorPorcion}, ${r.porciones}, ${cid}, ${r.calorias ?? null}, ${r.proteinas ?? null},
      ${r.carbohidratos ?? null}, ${r.grasas ?? null}, ${r.tipo ?? 'principal'})
    RETURNING id, nombre`
  return { accion: 'INSERT', ...row }
}

// Reescribe un lote al formato escalable: cantidades del paso entre llaves y porciones = 2.
// Los macros y el precio son por ración, así que no cambian al reajustar las porciones.
const NUM = '(?:\\d+(?:[.,]\\d+)?|[½¼¾⅓⅔]|\\d+[½¼¾⅓⅔])'
const UNID = 'g|ml|kg|l|cucharadas?|cucharaditas?|dientes?|vasos?|rebanadas?|lonchas?|rodajas?|latas?|paquetes?|puñados?'

/** Aplica fn solo al texto que queda fuera de las llaves, para que marcar sea idempotente. */
function fueraDeLlaves(texto, fn) {
  return texto
    .split(/(\{[^}]*\})/g)
    .map((trozo) => (trozo.startsWith('{') ? trozo : fn(trozo)))
    .join('')
}

function migrar(lote) {
  for (const r of lote) {
    // Contables del propio plato: los ingredientes en "ud" se citan por su nombre, sin unidad.
    const contables = [
      ...new Set(
        r.ingredientes
          .filter((i) => i.unidad === 'ud')
          // Sin normalizar: el patrón se aplica sobre el texto del paso, que lleva tildes.
          .map((i) => i.nombre.split(/\s+/)[0].replace(/e?s$/, ''))
          .filter((w) => w.length > 2)
      ),
    ]
    const reContable = contables.length
      ? new RegExp(`(?<![\\w½¼¾⅓⅔])(${NUM})\\s+((?:${contables.join('|')})\\w{0,3})\\b`, 'gi')
      : null

    r.pasos = r.pasos.map((p) =>
      fueraDeLlaves(p, (t) => {
        let out = t.replace(new RegExp(`(?<![\\w½¼¾⅓⅔])(${NUM})\\s+(${UNID})\\b`, 'gi'), '{$1 $2}')
        if (reContable) out = fueraDeLlaves(out, (u) => u.replace(reContable, '{$1 $2}'))
        return out
      })
    )

    if (r.porciones !== 2) {
      const f = 2 / r.porciones
      r.ingredientes = r.ingredientes.map((i) => ({ ...i, cantidad: +(i.cantidad * f).toFixed(2) }))
      r.pasos = r.pasos.map((p) =>
        p.replace(new RegExp(`\\{(${NUM})\\s*([^}]*)\\}`, 'g'), (_, n, resto) => {
          const v = /^[½¼¾⅓⅔]$/.test(n)
            ? { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3 }[n]
            : Number(String(n).replace(',', '.'))
          return `{${+(v * f).toFixed(2)} ${resto}}`.replace(/\s+\}/, '}')
        })
      )
      r.porciones = 2
    }
  }
  return lote
}

const [cmd, fichero] = process.argv.slice(2)

if (cmd === 'audit') {
  const todas = await leerTodas()
  let limpias = 0
  const porFallo = new Map()
  for (const r of todas) {
    const { errores, avisos } = validar(r)
    if (!errores.length && !avisos.length) { limpias++; continue }
    console.log(`\n## ${r.nombre}  [${r.id}]  ${r.categoria}/${r.tipo}`)
    errores.forEach((x) => { console.log(`   ERROR  ${x}`); porFallo.set(x.split(':')[0], (porFallo.get(x.split(':')[0]) ?? 0) + 1) })
    avisos.forEach((x) => console.log(`   aviso  ${x}`))
  }
  console.log(`\n=== ${todas.length} recetas | ${limpias} sin nada que corregir | ${todas.length - limpias} con hallazgos ===`)
} else if (cmd === 'remarcar') {
  // Marca las cantidades de los pasos directamente en la BD, sin tocar porciones.
  // Solo sobre recetas ya normalizadas a 2 raciones, para no reescalar nada por error.
  const todas = (await leerTodas()).filter((r) => r.porciones === 2)
  let tocadas = 0
  for (const r of todas) {
    const antes = JSON.stringify(r.pasos)
    const [m] = migrar([{ ...r, pasos: [...r.pasos] }])
    if (JSON.stringify(m.pasos) !== antes) {
      await sql`UPDATE recetas SET pasos = ${JSON.stringify(m.pasos)} WHERE id = ${r.id}`
      tocadas++
      console.log(`marcada  ${r.nombre}`)
    }
  }
  console.log(`\n${tocadas} de ${todas.length} recetas actualizadas`)
} else if (cmd === 'marcar') {
  const lote = migrar(JSON.parse(readFileSync(fichero, 'utf8')))
  writeFileSync(fichero, JSON.stringify(lote, null, 2) + '\n', 'utf8')
  console.log(`migradas ${lote.length} recetas en ${fichero}`)
} else if (cmd === 'check' || cmd === 'apply') {
  const lote = JSON.parse(readFileSync(fichero, 'utf8'))
  let fallos = 0
  for (const r of lote) {
    const { errores, avisos } = validar(r)
    if (errores.length) { fallos++; console.log(`\nX ${r.nombre}`); errores.forEach((x) => console.log(`   ERROR  ${x}`)) }
    else console.log(`ok ${r.nombre}${avisos.length ? '  (' + avisos.join('; ') + ')' : ''}`)
  }
  if (fallos) { console.log(`\n${fallos} receta(s) con errores. No se escribe nada.`); process.exit(1) }
  if (cmd === 'apply') {
    console.log('')
    for (const r of lote) {
      const res = await guardar(r)
      console.log(`${res.accion}  ${res.nombre}  ${res.id}`)
    }
  }
} else {
  console.log('uso: chef-recetas.mjs audit | check <json> | apply <json>')
  process.exit(1)
}
