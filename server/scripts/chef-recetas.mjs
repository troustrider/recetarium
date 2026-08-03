// Herramienta de mantenimiento del recetario para la skill chef-recetarium.
//
//   node scripts/chef-recetas.mjs audit                 -> audita toda la BD contra las puertas de calidad
//   node scripts/chef-recetas.mjs check <fichero.json>  -> valida un lote sin escribir
//   node scripts/chef-recetas.mjs check-doc             -> valida los ejemplos JSON de las referencias de la skill
//   node scripts/chef-recetas.mjs apply <fichero.json>  -> valida y escribe (UPDATE si trae id, INSERT si no)
//
// El UPDATE no toca favorita ni imagen, al contrario que el PUT de la API.

import 'dotenv/config'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
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
//
// El agua de cocción entra aquí a propósito: si la sal va entre llaves y el agua no,
// al subir de comensales se dobla la sal sobre el mismo volumen y la pasta sale salada.
// Y las piezas que fabrica el propio plato (albóndigas, bolas, brochetas) también, o al
// escalar sale el doble de masa repartida en el mismo número de piezas, con su tiempo viejo.
const PIEZAS = 'albondigas?|albóndigas?|bolas?|brochetas?|filetes?|hamburguesas?|croquetas?|tortitas?|muffins?|pinchos?|rollitos?|huecos?|bolitas?'
const RE_SIN_MARCAR = new RegExp(
  `\\b\\d+(?:[.,]\\d+)?\\s*(?:litros?|g|ml|kg|l|cucharadas?|cucharaditas?|dientes?|vasos?|rebanadas?|lonchas?|rodajas?|latas?|paquetes?|puñados?|${PIEZAS})\\b`,
  'i'
)
const sinLlaves = (p) => p.replace(/\{[^}]*\}/g, ' ')

// Metacomentario de autoría en `consejos`. La app lo renderiza como "Consejos del chef":
// hablar de versiones anteriores o de posiciones en el ranking del recetario es ruido de
// proceso en un campo que solo debe servir para cocinar mejor el plato que se tiene delante.
const RE_META_CONSEJO = /versi[oó]n anterior|versión previa|antes llev|antes ten[ií]a|la anterior|del recetario|en el recetario|respecto a la versi|se iba de rango|he subido|he bajado/i

// Verduras que forman la base aromática y no cuentan como verdura del plato.
const RE_BASE_AROMATICA = /^(ajo|cebolla|cebolla roja|cebolleta|chalota|puerro|tomate triturado|tomate frito|passata|perejil|cilantro|albahaca|menta|cebollino|limon|lima|guindilla|chile jalapeno)$/
// Formas en que un consejo declara de verdad la guarnición. Es una heurística de prosa: ve
// que el autor pensó en la comida completa, no si lo que propone pega con el plato.
const RE_GUARNICION = /guarnici[oó]n|al lado|acompa[ñn]|de acompa|s[ií]rve(?:lo|la)? con|se (?:come|sirve|toma) (?:con|en)|va con|encima van|por encima van/i

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

// Palabras vacías al buscar un ingrediente dentro de los pasos.
const STOP = new Set(['de', 'del', 'la', 'el', 'en', 'con', 'y', 'al', 'a', 'para', 'los', 'las'])
const IMPLICITOS = new Set(['sal', 'pimienta', 'agua'])

function nucleo(nombre) {
  return norm(nombre).split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w))
}

// --- estimación de macros desde la lista de ingredientes -------------------------------
//
// El gate de 4P+4C+9G solo comprueba que los cuatro números cuadren entre sí: un macro
// inventado que cuadre consigo mismo pasa. Esto contrasta lo declarado contra la
// composición real de los ingredientes, que es lo único que convierte la puerta de
// proteína en una puerta y no en un número autodeclarado.

const AQUI = dirname(fileURLToPath(import.meta.url))
const TABLA = JSON.parse(readFileSync(resolve(AQUI, 'nutrientes.json'), 'utf8'))
const FICHAS = new Map(Object.entries(TABLA.ingredientes).map(([k, v]) => [norm(k), v]))
const SIN_FICHA_OK = new Set(TABLA.ignorar.map(norm))
// Unidades cuyo peso depende tanto del producto que sin override no se puede estimar.
const UNIDAD_NECESITA_FICHA = new Set(['ud', 'lata', 'paquete', 'loncha', 'rodaja', 'rebanada', 'tira', 'vaso'])

/** Gramos de producto que aporta un ingrediente, o null si no se puede saber. */
function gramos(ing, ficha) {
  const u = ing.unidad
  if (u === 'g' || u === 'ml') return ing.cantidad
  if (ficha && typeof ficha[u] === 'number') return ing.cantidad * ficha[u]
  if (UNIDAD_NECESITA_FICHA.has(u)) return null
  const base = TABLA.unidades[u]
  return typeof base === 'number' ? ing.cantidad * base : null
}

/**
 * Macros por ración estimados desde `ingredientes`.
 * `desconocidos` lista lo que no se ha podido valorar: si trae algo, el resultado no es
 * comparable y el gate se abstiene en vez de acusar en falso.
 */
export function estimarMacros(r) {
  const desconocidos = []
  let p = 0, c = 0, g = 0
  for (const ing of r.ingredientes ?? []) {
    const n = norm(ing.nombre)
    if (SIN_FICHA_OK.has(n)) continue
    const ficha = FICHAS.get(n)
    if (!ficha) { desconocidos.push(ing.nombre); continue }
    const gr = gramos(ing, ficha)
    if (gr === null) { desconocidos.push(`${ing.nombre} (${ing.unidad})`); continue }
    p += (gr * ficha.p) / 100
    c += (gr * ficha.c) / 100
    g += (gr * ficha.gr) / 100
  }
  const porciones = r.porciones > 0 ? r.porciones : 1
  return {
    desconocidos,
    proteinas: p / porciones,
    carbohidratos: c / porciones,
    grasas: g / porciones,
    calorias: (p * 4 + c * 4 + g * 9) / porciones,
  }
}

const pct = (declarado, estimado) => Math.abs(declarado - estimado) / estimado

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
  if (Array.isArray(r.consejos))
    r.consejos.forEach((con, n) => {
      const meta = con.match(RE_META_CONSEJO)
      if (meta) e.push(`consejo ${n + 1}: metacomentario de autoría ("${meta[0]}")`)
    })

  // --- comida completa ---
  // Un principal sin verdura y sin guarnición declarada es un componente vendido como
  // comida, y sus macros describen media cena.
  if (estricto && r.tipo === 'principal' && Array.isArray(r.ingredientes)) {
    const verduras = r.ingredientes.filter(
      (i) => i.familia === 'verduras' && !RE_BASE_AROMATICA.test(norm(i.nombre))
    )
    const declaraGuarnicion = (r.consejos ?? []).some((c) => RE_GUARNICION.test(c))
    if (!verduras.length && !declaraGuarnicion)
      e.push('principal sin verdura propia y sin guarnición declarada en consejos')
  }

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
  // Coherencia interna (arriba) no es verdad. Esto contrasta lo declarado contra la
  // composición de los ingredientes. Si algún ingrediente no tiene ficha en
  // nutrientes.json el gate se abstiene: preferimos ampliar la tabla a acusar en falso.
  if (Array.isArray(r.ingredientes) && r.ingredientes.length) {
    const est = estimarMacros(r)
    if (est.desconocidos.length) {
      w.push(`macros sin contrastar, falta ficha en nutrientes.json de: ${est.desconocidos.join(', ')}`)
    } else {
      // Proteína y carbohidrato se comen enteros: lo que entra en la lista acaba en el
      // plato, así que aquí el umbral aprieta y es ERROR.
      if (typeof p === 'number' && est.proteinas >= 5 && pct(p, est.proteinas) > 0.2)
        e.push(`proteína declarada ${p} g/ración, los ingredientes dan ${est.proteinas.toFixed(1)} g`)
      if (typeof c === 'number' && est.carbohidratos >= 10 && pct(c, est.carbohidratos) > 0.25)
        e.push(`carbohidratos declarados ${c} g/ración, los ingredientes dan ${est.carbohidratos.toFixed(1)} g`)
      // La grasa es el único macro con una pregunta real de retención: el aceite de una
      // fritura por inmersión se queda casi entero en la sartén, y contarlo daría 240 g de
      // grasa por ración en unas croquetas. Aviso, y el número declarado manda.
      if (typeof g === 'number' && est.grasas >= 8 && pct(g, est.grasas) > 0.35)
        w.push(`grasas declaradas ${g} g/ración, los ingredientes dan ${est.grasas.toFixed(1)} g`)
      // Las kcal no se contrastan por separado: con P y C atados a los ingredientes y la
      // coherencia interna 4P+4C+9G al 10%, el único grado de libertad que queda es la
      // grasa, y ahí ya hemos decidido que el declarado es mejor estimador que la suma.
    }
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
const UNID = `litros?|g|ml|kg|l|cucharadas?|cucharaditas?|dientes?|vasos?|rebanadas?|lonchas?|rodajas?|latas?|paquetes?|puñados?|${PIEZAS}`

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

// Solo despacha comandos si se invoca directamente: así `validar` y `estimarMacros`
// se pueden importar desde otros scripts sin que arranque la CLI.
const comoCli = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (!comoCli) {
  // importado como módulo
} else if (cmd === 'audit') {
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
  const seco = fichero === '--dry'
  const todas = (await leerTodas()).filter((r) => r.porciones === 2)
  let tocadas = 0
  for (const r of todas) {
    const [m] = migrar([{ ...r, pasos: [...r.pasos] }])
    const cambios = r.pasos.map((p, i) => [p, m.pasos[i]]).filter(([a, b]) => a !== b)
    if (!cambios.length) continue
    tocadas++
    if (seco) {
      console.log(`\n## ${r.nombre}`)
      cambios.forEach(([, b]) => console.log(`   ${b}`))
    } else {
      await sql`UPDATE recetas SET pasos = ${JSON.stringify(m.pasos)} WHERE id = ${r.id}`
      console.log(`marcada  ${r.nombre}`)
    }
  }
  console.log(`\n${tocadas} de ${todas.length} recetas ${seco ? 'cambiarían' : 'actualizadas'}`)
} else if (cmd === 'marcar') {
  const lote = migrar(JSON.parse(readFileSync(fichero, 'utf8')))
  writeFileSync(fichero, JSON.stringify(lote, null, 2) + '\n', 'utf8')
  console.log(`migradas ${lote.length} recetas en ${fichero}`)
} else if (cmd === 'check-doc') {
  // El ejemplo de contrato-receta.md es el trozo de la skill que más pesa al escribir una
  // receta. Si él se salta una puerta, la enseña saltada. Esto lo ata al validador.
  const REFS = resolve(AQUI, '../../.claude/skills/chef-recetarium/references')
  const docs = ['contrato-receta.md']
  let fallos = 0
  for (const doc of docs) {
    const md = readFileSync(resolve(REFS, doc), 'utf8')
    const bloques = [...md.matchAll(/```json\n([\s\S]*?)```/g)].map((m) => m[1])
    if (!bloques.length) { console.log(`${doc}: sin bloques json`); continue }
    bloques.forEach((bloque, n) => {
      let receta
      try { receta = JSON.parse(bloque) } catch (err) {
        fallos++; console.log(`X ${doc} bloque ${n + 1}: JSON inválido — ${err.message}`); return
      }
      for (const r of [receta].flat()) {
        const { errores, avisos } = validar(r)
        if (errores.length) {
          fallos++
          console.log(`\nX ${doc} · ${r.nombre}`)
          errores.forEach((x) => console.log(`   ERROR  ${x}`))
        } else {
          console.log(`ok ${doc} · ${r.nombre}${avisos.length ? '  (' + avisos.join('; ') + ')' : ''}`)
        }
      }
    })
  }
  if (fallos) { console.log(`\n${fallos} ejemplo(s) de la documentación con errores.`); process.exit(1) }
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
  console.log('uso: chef-recetas.mjs audit | check <json> | check-doc | apply <json> | marcar <json> | remarcar')
  process.exit(1)
}
