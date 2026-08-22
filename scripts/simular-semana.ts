import { readFileSync } from 'node:fs'
import { repartirSemana, type Hueco } from '../src/utils/semana'
import { candidatas } from '../src/utils/candidatas'
import { cabeDeNoche } from '../src/utils/momentos'
import { claveNombre } from '../src/utils/ingredientes'
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

export function simular(recetas: RecetaListada[], prefs: Preferencias, semilla: number) {
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

  const { porHueco, repetidos } = repartirSemana(huecos, { preferencias: prefs, semilla })
  return { huecos, porHueco, repetidos, principales, desayunos, deNoche }
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

const PASADAS = 20

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

  console.log(`catálogo: ${recetas.length} recetas\n`)

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

    for (let i = 0; i < PASADAS; i++) {
      const { huecos, porHueco, repetidos } = simular(recetas, prefs, 1000 + i)
      vacios += huecos.filter((h) => !porHueco.has(h.id)).length
      repes += repetidos.size
      const puestas = [...porHueco.values()]
      for (const r of puestas) { platos.add(r.id); if (r.categoria) cocinas.add(r.categoria) }
      const s = sinergia(puestas.filter(esPrincipal))
      ratio += s.ratio
      reuso += s.reuso
    }

    const etiqueta = dieta ?? 'sin dieta'
    console.log(`${etiqueta.padEnd(14)} huecos vacíos ${(vacios / PASADAS).toFixed(1)}/21` +
      `  repetidos ${(repes / PASADAS).toFixed(1)}` +
      `  platos distintos en ${PASADAS} semanas ${platos.size}` +
      `  cocinas ${cocinas.size}` +
      `  ingredientes compartidos ${(100 * ratio / PASADAS).toFixed(0)}%` +
      `  reuso ${(reuso / PASADAS).toFixed(2)}`)
  }
}

if (process.argv[2]) main()
