import { readFileSync } from 'node:fs'
import { repartirSemana, type Hueco } from '../src/utils/semana'
import { candidatas } from '../src/utils/candidatas'
import { cabeDeNoche } from '../src/utils/momentos'
import { claveNombre } from '../src/utils/ingredientes'
import { cuentaDeLaCompra, COBERTURA_ENVASES } from '../src/utils/desperdicio'
import { esNoPerecedero, sumarDias } from '../src/utils/caducidadEstimada'
import type { ItemAprovechable } from '../src/utils/aprovechamiento'
import { resumenSemana } from '../src/utils/semana'
import { PREFERENCIAS_POR_DEFECTO, type Preferencias } from '../src/types/preferencias'
import type { RecetaListada } from '../src/types/receta'

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const FINDE = new Set(['Sábado', 'Domingo'])

const esDesayuno = (r: RecetaListada) => r.tipo === 'desayuno'
const esPrincipal = (r: RecetaListada) => (r.tipo ?? 'principal') === 'principal'

const repartidos = (dias: string[], cuantos: number) => {
  if (cuantos <= 0) return []
  const paso = dias.length / cuantos
  return Array.from({ length: cuantos }, (_, i) => dias[Math.floor(i * paso)])
}

/**
 * Una despensa de casa: lo que hay abierto o a punto de caducar, que es lo que
 * la auto-semana tiene que gastar antes que nada.
 */
export function despensaDeCasa(recetas: RecetaListada[], cuantos: number, semilla: number): ItemAprovechable[] {
  const vistos = new Map<string, { nombre: string; familia: string }>()
  for (const r of recetas) {
    for (const i of r.ingredientes) {
      const clave = claveNombre(i.nombre)
      if (!vistos.has(clave)) vistos.set(clave, { nombre: i.nombre, familia: i.familia })
    }
  }
  const todos = [...vistos.values()]
  const items: ItemAprovechable[] = []
  let s = semilla
  const siguiente = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648
  while (items.length < cuantos && todos.length > 0) {
    const cual = todos.splice(Math.floor(siguiente() * todos.length), 1)[0]
    // La mitad, perecederos que corren prisa; el resto, fondo de armario.
    const perecedero = !esNoPerecedero(cual.nombre, cual.familia)
    items.push(perecedero ? { ...cual, caducidad: sumarDias(items.length % 4) } : cual)
  }
  return items
}

export function simular(recetas: RecetaListada[], prefs: Preferencias, semilla: number, despensa: ItemAprovechable[] = []) {
  const { limites } = prefs
  const principales = recetas.filter(esPrincipal)
  const desayunos = recetas.filter(esDesayuno)
  const deNoche = principales.filter(cabeDeNoche)

  const topeDe = (dia: string) => (FINDE.has(dia) ? limites.tiempoMaxFinde : limites.tiempoMax)
  const construir = (dias: string[], momento: string, pool: RecetaListada[], conTiempo: boolean): Hueco[] =>
    dias.map((dia) => ({
      id: `${dia}:${momento}`,
      dia,
      candidatos: candidatas(pool, limites, conTiempo ? topeDe(dia) : null),
    }))

  const huecos = [
    ...construir(repartidos(DIAS, prefs.comidas), 'comida', principales, true),
    ...construir(repartidos(DIAS, prefs.cenas), 'cena', deNoche, true),
    ...construir(repartidos(DIAS, prefs.desayunos), 'desayuno', desayunos, false),
  ]

  const { porHueco, repetidos, aprovechados } = repartirSemana(huecos, { preferencias: prefs, semilla, despensa })
  return { huecos, porHueco, repetidos, aprovechados, principales, desayunos, deNoche }
}

/** Cuántos ingredientes de la compra los pide más de un plato de la semana. */
export function sinergia(platos: RecetaListada[]) {
  const veces = new Map<string, number>()
  for (const receta of platos) {
    const suyos = new Set(
      [...receta.ingredientes, ...(receta.guarnicion?.ingredientes ?? [])].map((i) => claveNombre(i.nombre))
    )
    for (const clave of suyos) veces.set(clave, (veces.get(clave) ?? 0) + 1)
  }
  const distintos = veces.size
  const compartidos = [...veces.values()].filter((n) => n > 1).length
  const lineas = [...veces.values()].reduce((a, b) => a + b, 0)
  return { distintos, compartidos, reuso: lineas / distintos, ratio: compartidos / distintos }
}

const PASADAS = Number(process.env.PASADAS ?? 20)

/** Proteína y número de comidas de cada día de la semana repartida. */
function proteinaPorDia(porHueco: Map<string, RecetaListada>) {
  const dias = new Map<string, { gramos: number; comidas: number }>()
  for (const [id, receta] of porHueco) {
    const dia = id.split(':')[0]
    const antes = dias.get(dia) ?? { gramos: 0, comidas: 0 }
    dias.set(dia, { gramos: antes.gramos + (receta.proteinas ?? 0), comidas: antes.comidas + 1 })
  }
  return [...dias.values()]
}

function main() {
  const recetas: RecetaListada[] = JSON.parse(readFileSync(process.argv[2], 'utf8'))
  const dietas: (Preferencias['limites']['dieta'])[] = [null, 'vegetariana', 'vegana']

  const cob = COBERTURA_ENVASES()
  console.log(`catálogo: ${recetas.length} recetas | envase conocido en ${cob.con}/${cob.total} precios\n`)

  const proteica: Preferencias = {
    ...PREFERENCIAS_POR_DEFECTO,
    comidas: 7,
    prioridades: ['proteina'],
  }
  const dias: { gramos: number; comidas: number }[] = []
  for (let i = 0; i < PASADAS; i++) {
    dias.push(...proteinaPorDia(simular(recetas, proteica, 2000 + i).porHueco))
  }
  console.log('semana proteica, objetivo 125 g al día')
  for (const comidas of [2, 3]) {
    const suyos = dias.filter((d) => d.comidas === comidas).map((d) => d.gramos).sort((a, b) => a - b)
    if (suyos.length === 0) continue
    const media = suyos.reduce((a, b) => a + b, 0) / suyos.length
    console.log(`  días de ${comidas} comidas (${suyos.length}): media ${media.toFixed(0)} g` +
      `  llegan a 120 ${suyos.filter((g) => g >= 120).length}/${suyos.length}` +
      `  peor ${suyos[0].toFixed(0)}  mejor ${suyos[suyos.length - 1].toFixed(0)}`)
  }
  console.log()

  const DESPENSA = Number(process.env.DESPENSA ?? 12)

  for (const dieta of dietas) {
    const prefs: Preferencias = {
      ...PREFERENCIAS_POR_DEFECTO,
      comidas: 7,
      limites: { ...PREFERENCIAS_POR_DEFECTO.limites, dieta },
    }

    let vacios = 0
    let repes = 0
    const cocinas = new Set<string>()
    const platos = new Set<string>()
    let ratio = 0
    let reuso = 0
    let pagado = 0
    let comido = 0
    let tirado = 0
    let gastados = 0
    let gastadosFrescos = 0
    let enCasa = 0
    let enCasaFrescos = 0
    let fibra = 0
    let proteinas = 0
    let sinVerdura = 0
    let conPlato = 0

    for (let i = 0; i < PASADAS; i++) {
      const despensa = DESPENSA > 0 ? despensaDeCasa(recetas, DESPENSA, 7000 + i) : []
      const { huecos, porHueco, repetidos, aprovechados } = simular(recetas, prefs, 1000 + i, despensa)
      vacios += huecos.filter((h) => !porHueco.has(h.id)).length
      repes += repetidos.size
      const puestas = [...porHueco.values()]
      for (const r of puestas) { platos.add(r.id); if (r.categoria) cocinas.add(r.categoria) }
      const s = sinergia(puestas.filter(esPrincipal))
      ratio += s.ratio
      reuso += s.reuso
      const c = cuentaDeLaCompra(puestas)
      pagado += c.pagado
      comido += c.comido
      tirado += c.tirado

      const frescos = new Set(despensa.filter((d) => !esNoPerecedero(d.nombre, d.familia)).map((d) => d.nombre))
      enCasa += despensa.length
      enCasaFrescos += frescos.size
      gastados += aprovechados.length
      gastadosFrescos += aprovechados.filter((n) => frescos.has(n)).length

      const resumen = resumenSemana(puestas, prefs)
      fibra += resumen.coberturas.find((c) => c.clave === 'fibra')?.ratio ?? 0
      proteinas += resumen.coberturas.find((c) => c.clave === 'proteinas')?.ratio ?? 0
      for (const r of puestas) {
        conPlato++
        const verduras = [...r.ingredientes, ...(r.guarnicion?.ingredientes ?? [])]
        if (!verduras.some((i) => i.familia === 'verduras')) sinVerdura++
      }
    }

    const etiqueta = dieta ?? 'sin dieta'
    console.log(`${etiqueta.padEnd(14)} huecos vacíos ${(vacios / PASADAS).toFixed(1)}/21` +
      `  repetidos ${(repes / PASADAS).toFixed(1)}` +
      `  platos distintos en ${PASADAS} semanas ${platos.size}` +
      `  cocinas ${cocinas.size}` +
      `  ingredientes compartidos ${(100 * ratio / PASADAS).toFixed(0)}%` +
      `  reuso ${(reuso / PASADAS).toFixed(2)}`)
    console.log(`${' '.repeat(14)} despensa: gasta ${(gastados / PASADAS).toFixed(1)}/${(enCasa / PASADAS).toFixed(0)}` +
      `  de los que corren prisa ${(gastadosFrescos / PASADAS).toFixed(1)}/${(enCasaFrescos / PASADAS).toFixed(1)}`)
    console.log(`${' '.repeat(14)} la compra: paga ${(pagado / PASADAS).toFixed(2)} €` +
      `  come ${(comido / PASADAS).toFixed(2)} €` +
      `  tira ${(tirado / PASADAS).toFixed(2)} € (${(100 * tirado / (pagado || 1)).toFixed(0)}% de lo pagado,` +
      ` ${(100 * tirado / (comido || 1)).toFixed(0)}% de lo comido)`)
    console.log(`${' '.repeat(14)} la mesa:   fibra ${(100 * fibra / PASADAS).toFixed(0)}% del objetivo` +
      `  proteína ${(100 * proteinas / PASADAS).toFixed(0)}%` +
      `  platos sin verdura ${(100 * sinVerdura / (conPlato || 1)).toFixed(0)}%`)
  }
}

if (process.argv[2]) main()
