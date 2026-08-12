import 'dotenv/config'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { neon } from '@neondatabase/serverless'
import { norm, estimarMacros, fichaNutricional } from '../src/lib/nutricion.js'

export { estimarMacros, fichaNutricional }

const AQUI = dirname(fileURLToPath(import.meta.url))

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
const VERBOS = /\b(cuece|cuécelo|hierve|hornea|asa|ásalo|fríe|sofríe|saltea|dora|dóralo|reduce|marina|reposa|pocha|glasea|tuesta|escalda|cuaja)\b/i
const RE_VAGO = /\b(un poco de|un chorro|un chorrito|unas gotas|al gusto|algo de|un buen punado|suficiente|la cantidad necesaria|unos minutos|un rato|un vaso de agua)\b/
const PIEZAS = 'albondigas?|albóndigas?|bolas?|brochetas?|filetes?|hamburguesas?|croquetas?|tortitas?|muffins?|pinchos?|rollitos?|huecos?|bolitas?'
const RE_SIN_MARCAR = new RegExp(
  `\\b\\d+(?:[.,]\\d+)?\\s*(?:litros?|g|ml|kg|l|cucharadas?|cucharaditas?|dientes?|vasos?|rebanadas?|lonchas?|rodajas?|latas?|paquetes?|puñados?|${PIEZAS})\\b`,
  'i'
)
const sinLlaves = (p) => p.replace(/\{[^}]*\}/g, ' ')

const RE_META_CONSEJO = /versi[oó]n anterior|versión previa|antes llev|antes ten[ií]a|la anterior|del recetario|en el recetario|respecto a la versi|se iba de rango|he subido|he bajado|corregid[oa]s?\b|corrijo|la ficha (?:dec[ií]a|ten[ií]a|estaba)|ficha anterior|estaba[n]? mal/i

const RE_PRIMERA_PERSONA =
  /no lo vendo|lo vendo como|etiqueto|(?:no lo |lo )presento como|propongo|planteo|prefiero|recomiendo|considero|opino|he (?:a[ñn]adido|puesto|quitado|cambiado|ajustado|dejado|usado|preferido)|adici[oó]n m[ií]a|aportaci[oó]n m[ií]a|a mi juicio|me parece|personalmente/i

const RE_REGLA_PERSONAL = /tu m[ií]nimo|tus \d+ g|tu objetivo|tus macros/i

const RE_BASE_AROMATICA = /^(ajo|cebolla|cebolla roja|cebolleta|chalota|puerro|tomate triturado|tomate frito|passata|perejil|cilantro|albahaca|menta|cebollino|limon|lima|guindilla|chile jalapeno)$/
const RE_GUARNICION = /guarnici[oó]n|al lado|acompa[ñn]|de acompa|s[ií]rve(?:lo|la)? con|se (?:come|sirve|toma) (?:con|en)|va con|encima van|por encima van/i

const STOP = new Set(['de', 'del', 'la', 'el', 'en', 'con', 'y', 'al', 'a', 'para', 'los', 'las'])
const IMPLICITOS = new Set(['sal', 'pimienta', 'agua'])

function nucleo(nombre) {
  return norm(nombre).split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w))
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

  if (Array.isArray(r.pasos) && r.pasos.length) {
    const minPasos = r.tipo === 'principal' ? 5 : 4
    if (r.pasos.length < minPasos) e.push(`solo ${r.pasos.length} pasos (mínimo ${minPasos} para ${r.tipo ?? 'principal'})`)

    const cocinados = r.pasos.filter((p) => VERBOS.test(p.replace(/mientras[^,.]*[,.]/gi, ' '))).length
    const minTiempos = cocinados >= 2 ? 3 : 2
    const conTiempo = r.pasos.filter((p) => RE_TIEMPO.test(p)).length
    if (conTiempo < minTiempos) e.push(`solo ${conTiempo} paso(s) con duración parseable (mínimo ${minTiempos})`)

    r.pasos.forEach((p, n) => {
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

    const RE_PUNTO_CARNE = /jugo salga transparente|(?:sin|no qued[ae]n?) (?:zonas? )?ro(?:sas?|jas?|sad[oa]s?)|sin que quede ro|se desha[gc]a al|se deshilache|se deshebre/i
    const CURADOS = /jam[oó]n|spek|bacon|chorizo|panceta|pancetta|guanciale|salchich[oó]n|sobrasada|rookworst|lomo embuchado|cecina|salami|fuet|rookvlees|mortadela|pastrami|corned beef|en lonchas/i
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
      const yo = con.match(RE_PRIMERA_PERSONA)
      if (yo) e.push(`consejo ${n + 1}: primera persona ("${yo[0]}")`)
      const regla = con.match(RE_REGLA_PERSONAL)
      if (regla) e.push(`consejo ${n + 1}: regla personal de macros ("${regla[0]}")`)
    })

  if (estricto && r.tipo === 'principal' && Array.isArray(r.ingredientes)) {
    const verduras = r.ingredientes.filter(
      (i) => i.familia === 'verduras' && !RE_BASE_AROMATICA.test(norm(i.nombre))
    )
    const tieneCampo = r.guarnicion != null && Array.isArray(r.guarnicion.ingredientes) && r.guarnicion.ingredientes.length > 0
    const declaraEnProsa = (r.consejos ?? []).some((c) => RE_GUARNICION.test(c))
    if (!verduras.length && !tieneCampo && !declaraEnProsa)
      e.push('principal sin verdura propia y sin guarnición (ni campo `guarnicion` ni declarada en consejos)')
    if (!verduras.length && !tieneCampo && declaraEnProsa)
      w.push('guarnición solo en prosa: pásala al campo `guarnicion` para que entre en la compra')
  }

  if (Array.isArray(r.ingredientes) && Array.isArray(r.pasos)) {
    const texto = norm(r.pasos.join(' ') + ' ' + (r.consejos || []).join(' '))
    for (const i of r.ingredientes) {
      if (IMPLICITOS.has(norm(i.nombre))) continue
      const palabras = nucleo(i.nombre)
      if (palabras.length && !palabras.some((p) => texto.includes(p.replace(/s$/, ''))))
        e.push(`"${i.nombre}" está en la lista pero no aparece en ningún paso`)
    }
  }

  const { calorias: kcal, proteinas: p, carbohidratos: c, grasas: g } = r
  if ([kcal, p, c, g].every((x) => typeof x === 'number')) {
    const calc = p * 4 + c * 4 + g * 9
    const desvio = Math.abs(calc - kcal) / kcal
    if (desvio > 0.1) e.push(`macros incoherentes: ${p}P/${c}C/${g}G = ${Math.round(calc)} kcal, pero la ficha dice ${kcal}`)
  }
  if (Array.isArray(r.ingredientes) && r.ingredientes.length) {
    const est = estimarMacros(r)
    if (est.desconocidos.length) {
      w.push(`macros sin contrastar, falta ficha en nutrientes.json de: ${est.desconocidos.join(', ')}`)
    } else {
      if (typeof p === 'number' && est.proteinas >= 5 && pct(p, est.proteinas) > 0.2)
        e.push(`proteína declarada ${p} g/ración, los ingredientes dan ${est.proteinas.toFixed(1)} g`)
      if (typeof c === 'number' && est.carbohidratos >= 10 && pct(c, est.carbohidratos) > 0.25)
        e.push(`carbohidratos declarados ${c} g/ración, los ingredientes dan ${est.carbohidratos.toFixed(1)} g`)
      if (typeof g === 'number' && est.grasas >= 8 && pct(g, est.grasas) > 0.35)
        w.push(`grasas declaradas ${g} g/ración, los ingredientes dan ${est.grasas.toFixed(1)} g`)
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
           r.proteinas::float AS proteinas, r.carbohidratos::float AS carbohidratos, r.grasas::float AS grasas,
           r.guarnicion
    FROM recetas r JOIN categories c ON r.category_id = c.id
    WHERE r.borrada_en IS NULL ORDER BY r.nombre`
}

async function guardar(r) {
  const cid = await categoryId(r.sabor)
  const ing = JSON.stringify(r.ingredientes)
  const pas = JSON.stringify(r.pasos)
  const con = JSON.stringify(r.consejos ?? [])
  const f = fichaNutricional(r)
  const mic = JSON.stringify(f.micros)
  if (r.id) {
    const [row] = await sql`
      UPDATE recetas SET nombre = ${r.nombre}, categoria = ${r.categoria ?? null},
        tiempo_preparacion = ${r.tiempoPreparacion}, ingredientes = ${ing}, pasos = ${pas},
        consejos = ${con}, category_id = ${cid}, precio_por_porcion = ${r.precioPorPorcion},
        porciones = ${r.porciones}, calorias = ${r.calorias ?? null}, proteinas = ${r.proteinas ?? null},
        carbohidratos = ${r.carbohidratos ?? null}, grasas = ${r.grasas ?? null}, tipo = ${r.tipo ?? 'principal'},
        hierro = ${f.hierro}, sin_gluten = ${f.sinGluten}, micros = ${mic}
      WHERE id = ${r.id} RETURNING id, nombre`
    if (!row) throw new Error(`id no encontrado: ${r.id}`)
    return { accion: 'UPDATE', ...row }
  }
  const [row] = await sql`
    INSERT INTO recetas (nombre, categoria, tiempo_preparacion, ingredientes, pasos, consejos,
      precio_por_porcion, porciones, category_id, calorias, proteinas, carbohidratos, grasas, tipo,
      hierro, sin_gluten, micros)
    VALUES (${r.nombre}, ${r.categoria ?? null}, ${r.tiempoPreparacion}, ${ing}, ${pas}, ${con},
      ${r.precioPorPorcion}, ${r.porciones}, ${cid}, ${r.calorias ?? null}, ${r.proteinas ?? null},
      ${r.carbohidratos ?? null}, ${r.grasas ?? null}, ${r.tipo ?? 'principal'},
      ${f.hierro}, ${f.sinGluten}, ${mic})
    RETURNING id, nombre`
  return { accion: 'INSERT', ...row }
}

const NUM = '(?:\\d+(?:[.,]\\d+)?|[½¼¾⅓⅔]|\\d+[½¼¾⅓⅔])'
const UNID = `litros?|g|ml|kg|l|cucharadas?|cucharaditas?|dientes?|vasos?|rebanadas?|lonchas?|rodajas?|latas?|paquetes?|puñados?|${PIEZAS}`

function fueraDeLlaves(texto, fn) {
  return texto
    .split(/(\{[^}]*\})/g)
    .map((trozo) => (trozo.startsWith('{') ? trozo : fn(trozo)))
    .join('')
}

function migrar(lote) {
  for (const r of lote) {
    const contables = [
      ...new Set(
        r.ingredientes
          .filter((i) => i.unidad === 'ud')
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

const comoCli = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (!comoCli) {
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
} else if (cmd === 'nutricion') {
  const seco = fichero === '--dry'
  const todas = await leerTodas()
  const sinFicha = new Map()
  let conGluten = 0, dudosas = 0, parciales = 0
  for (const r of todas) {
    const f = fichaNutricional(r)
    estimarMacros(r).sinFicha.forEach((n) => sinFicha.set(n, (sinFicha.get(n) ?? 0) + 1))
    if (f.sinGluten === false) conGluten++
    if (f.sinGluten === null) dudosas++
    if (f.micros.estimadoDe === 'parcial') parciales++
    if (!seco)
      await sql`UPDATE recetas SET hierro = ${f.hierro}, sin_gluten = ${f.sinGluten},
                micros = ${JSON.stringify(f.micros)} WHERE id = ${r.id}`
  }
  console.log(`${todas.length} recetas ${seco ? 'se recalcularían' : 'actualizadas'}`)
  console.log(`  con gluten: ${conGluten} | sin gluten: ${todas.length - conGluten - dudosas} | no afirmable: ${dudosas}`)
  console.log(`  ficha parcial (alguna cantidad sin convertir a gramos): ${parciales}`)
  if (sinFicha.size) {
    console.log(`\ningredientes sin ficha en nutrientes.json (${sinFicha.size}):`)
    ;[...sinFicha].sort((a, b) => b[1] - a[1]).forEach(([n, c]) => console.log(`   ${c}x  ${n}`))
  }
} else if (cmd === 'marcar') {
  const lote = migrar(JSON.parse(readFileSync(fichero, 'utf8')))
  writeFileSync(fichero, JSON.stringify(lote, null, 2) + '\n', 'utf8')
  console.log(`migradas ${lote.length} recetas en ${fichero}`)
} else if (cmd === 'check-doc') {
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
