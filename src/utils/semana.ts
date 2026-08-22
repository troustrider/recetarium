import type { RecetaListada } from '../types/receta'
import type { Preferencias, Prioridad } from '../types/preferencias'
import { aprovechaDe, indiceDespensa, type IndiceDespensa, type ItemAprovechable } from './aprovechamiento'
import { claveNombre, ingredientesDe } from './ingredientes'

const DIAS_SEMANA = 7

const PROTEINA_ALTA_DIARIA = 125
const COMIDAS_AL_DIA = 3

const OBJETIVO_POR_COMIDA = {
  fibra: 12,
  vitaminaC: 32,
  calcio: 400,
  folato: 130,
  hierro: 5.6,
  b12: 1.3,
  proteinas: 40,
} as const

type Clave = keyof typeof OBJETIVO_POR_COMIDA

const CLAVES = Object.keys(OBJETIVO_POR_COMIDA) as Clave[]

const TECHOS_BASE = {
  saturadas: 12,
  sal: 3,
  azucares: 25,
  calorias: Infinity,
} as const

type Techo = keyof typeof TECHOS_BASE

const PESO_TECHO: Record<Techo, number> = {
  saturadas: 0.4,
  sal: 0.5,
  azucares: 0.4,
  calorias: 0.6,
}

const PESOS_BASE = {
  cocinaRepetida: 0.35,
  verduraRepetida: 0.3,
  sinVerdura: 0.15,
  saborRepetido: 0.2,
  reparto: 0.8,
  noFavorita: 0.5,
  aprovechar: 0.35,
  compartir: 0.5,
}

const TOPE_APROVECHAMIENTO = 2

const TOPE_COMPARTIR = 1.5

const rarezaDe = (veces: number) => 1 / (1 + veces)

const PENALIZACION_DESCARTADO = 5
const PENALIZACION_YA_PROPUESTO = 0.6

type Peso = keyof typeof PESOS_BASE

// Qué mueve cada prioridad. Es una tabla y no código a propósito: añadir una
// prioridad nueva mañana es añadir una fila.
const EFECTO: Record<Prioridad, { objetivo?: Partial<Record<Clave, number>>; techo?: Partial<Record<Techo, number>>; peso?: Partial<Record<Peso, number>> }> = {
  proteina:       { objetivo: { proteinas: 1.35 } },
  fibra:          { objetivo: { fibra: 1.4 }, peso: { sinVerdura: 0.3, verduraRepetida: 0.4 } },
  hierro:         { objetivo: { hierro: 1.4, vitaminaC: 1.2 } },
  calcio:         { objetivo: { calcio: 1.3 } },
  b12folato:      { objetivo: { b12: 1.3, folato: 1.3 } },
  menosSal:       { techo: { sal: 1.5 } },
  menosAzucar:    { techo: { azucares: 12 } },
  menosSaturadas: { techo: { saturadas: 6 } },
  ligera:         { techo: { calorias: 600 } },
}

const MACROS = ['proteinas', 'carbohidratos', 'grasas'] as const
type Macro = typeof MACROS[number]

const REPARTO: Record<Macro, number> = { proteinas: 0.3, carbohidratos: 0.4, grasas: 0.3 }
const KCAL_POR_GRAMO: Record<Macro, number> = { proteinas: 4, carbohidratos: 4, grasas: 9 }

const FAMILIA_VERDURA = 'verduras'

interface Aporte extends Record<Clave, number>, Record<Techo, number> {
  carbohidratos: number
  grasas: number
}

const VACIO: Aporte = {
  fibra: 0, vitaminaC: 0, calcio: 0, folato: 0, hierro: 0, b12: 0,
  proteinas: 0, carbohidratos: 0, grasas: 0,
  saturadas: 0, sal: 0, azucares: 0, calorias: 0,
}

export function aporteDe(receta: RecetaListada): Aporte {
  const partes = [receta, receta.guarnicion]
  const total = { ...VACIO }
  for (const parte of partes) {
    if (!parte) continue
    if (parte.hierro != null) total.hierro += parte.hierro
    for (const macro of MACROS) total[macro] += parte[macro] ?? 0
    total.calorias += parte.calorias ?? 0
    const micros = parte.micros
    if (!micros) continue
    total.fibra += micros.fibra
    total.vitaminaC += micros.vitaminaC
    total.calcio += micros.calcio
    total.folato += micros.folato
    total.b12 += micros.b12
    total.saturadas += micros.saturadas
    total.sal += micros.sal
    total.azucares += micros.azucares
  }
  return total
}

function verduraDe(receta: RecetaListada): string | null {
  const enGuarnicion = receta.guarnicion?.ingredientes.find((i) => i.familia === FAMILIA_VERDURA)
  const enPlato = receta.ingredientes?.find((i) => i.familia === FAMILIA_VERDURA)
  return (enGuarnicion ?? enPlato)?.nombre.toLowerCase() ?? null
}

function prng(semilla: number): () => number {
  let s = semilla >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface Ajustes {
  objetivos: Record<Clave, number>
  techos: Record<Techo, number>
  pesos: Record<Peso, number>
  favoritas: Set<string>
  /** Cuántas veces puede salir una cocina favorita sin que penalice. */
  cuotaFavorita: number
  proteinaDiaria: number | null
}

export function ajustesDe(preferencias?: Preferencias, huecos = DIAS_SEMANA): Ajustes {
  const objetivos = Object.fromEntries(
    CLAVES.map((c) => [c, OBJETIVO_POR_COMIDA[c] * Math.max(huecos, 1)])
  ) as Record<Clave, number>
  const techos = { ...TECHOS_BASE } as Record<Techo, number>
  const pesos = { ...PESOS_BASE }

  for (const prioridad of preferencias?.prioridades ?? []) {
    const efecto = EFECTO[prioridad]
    if (!efecto) continue
    for (const [clave, factor] of Object.entries(efecto.objetivo ?? {})) {
      objetivos[clave as Clave] *= factor as number
    }
    for (const [clave, valor] of Object.entries(efecto.techo ?? {})) {
      techos[clave as Techo] = Math.min(techos[clave as Techo], valor as number)
    }
    for (const [clave, valor] of Object.entries(efecto.peso ?? {})) {
      pesos[clave as Peso] = Math.max(pesos[clave as Peso], valor as number)
    }
  }

  const proteica = (preferencias?.prioridades ?? []).includes('proteina')
  if (proteica) {
    objetivos.proteinas = (PROTEINA_ALTA_DIARIA / COMIDAS_AL_DIA) * Math.max(huecos, 1)
  }

  const dieta = preferencias?.limites?.dieta
  if (dieta && !(preferencias?.prioridades ?? []).includes('proteina')) {
    for (const [clave, factor] of Object.entries(EFECTO.proteina.objetivo ?? {})) {
      objetivos[clave as Clave] *= factor as number
    }
  }

  const favoritas = new Set(preferencias?.cocinasFavoritas ?? [])
  return {
    objetivos,
    techos,
    pesos,
    favoritas,
    cuotaFavorita: favoritas.size > 0 ? Math.max(1, Math.ceil(huecos / favoritas.size)) : 1,
    proteinaDiaria: proteica ? PROTEINA_ALTA_DIARIA : null,
  }
}

interface Acumulado {
  nutrientes: Record<Clave, number>
  macros: Record<Macro, number>
  cocinas: Map<string, number>
  verduras: Set<string>
  sabores: Map<string, number>
  /** Índices de la despensa que la semana ya tiene comprometidos. */
  aprovechados: Set<number>
  /** Ingredientes que la semana ya va a comprar, por nombre canónico. */
  compra: Set<string>
  /** Proteína ya colocada en cada día, para la semana proteica. */
  proteinaPorDia: Map<string, number>
}

function acumuladoVacio(): Acumulado {
  return {
    nutrientes: Object.fromEntries(CLAVES.map((c) => [c, 0])) as Record<Clave, number>,
    macros: Object.fromEntries(MACROS.map((m) => [m, 0])) as Record<Macro, number>,
    cocinas: new Map(),
    verduras: new Set(),
    sabores: new Map(),
    aprovechados: new Set(),
    compra: new Set(),
    proteinaPorDia: new Map(),
  }
}

function acumular(acc: Acumulado, receta: RecetaListada, usados: number[] = [], dia?: string) {
  for (const i of usados) acc.aprovechados.add(i)
  if (dia) acc.proteinaPorDia.set(dia, (acc.proteinaPorDia.get(dia) ?? 0) + aporteDe(receta).proteinas)
  for (const clave of clavesDe(receta)) acc.compra.add(clave)
  const a = aporteDe(receta)
  for (const clave of CLAVES) acc.nutrientes[clave] += a[clave]
  for (const macro of MACROS) acc.macros[macro] += a[macro]
  if (receta.categoria) acc.cocinas.set(receta.categoria, (acc.cocinas.get(receta.categoria) ?? 0) + 1)
  const verdura = verduraDe(receta)
  if (verdura) acc.verduras.add(verdura)
  acc.sabores.set(receta.sabor, (acc.sabores.get(receta.sabor) ?? 0) + 1)
}

function desvioReparto(acumulado: Record<Macro, number>): number {
  const kcal = MACROS.reduce((t, m) => t + acumulado[m] * KCAL_POR_GRAMO[m], 0)
  if (kcal === 0) return 0
  const suma = MACROS.reduce(
    (t, m) => t + Math.abs((acumulado[m] * KCAL_POR_GRAMO[m]) / kcal - REPARTO[m]),
    0
  )
  return suma / 2
}

const acerca = (acumulado: number, suma: number, objetivo: number) =>
  (Math.min(acumulado + suma, objetivo) - Math.min(acumulado, objetivo)) / objetivo

function ganancia(a: Aporte, acc: Acumulado, ajustes: Ajustes, dia?: string): number {
  let g = 0
  for (const clave of CLAVES) {
    if (clave === 'proteinas' && ajustes.proteinaDiaria && dia) {
      g += acerca(acc.proteinaPorDia.get(dia) ?? 0, a.proteinas, ajustes.proteinaDiaria)
      continue
    }
    g += acerca(acc.nutrientes[clave], a[clave], ajustes.objetivos[clave])
  }
  return g
}

function gananciaDespensa(usados: number[], acc: Acumulado, indice: IndiceDespensa): number {
  let g = 0
  for (const i of usados) {
    if (!acc.aprovechados.has(i)) g += indice.pesos[i]
  }
  return Math.min(g, TOPE_APROVECHAMIENTO)
}

const clavesDe = (receta: RecetaListada) =>
  new Set(ingredientesDe(receta, true).map((i) => claveNombre(i.nombre)))

function gananciaCompartir(
  receta: RecetaListada,
  acc: Acumulado,
  rareza: Map<string, number>
): number {
  let g = 0
  for (const clave of clavesDe(receta)) {
    if (acc.compra.has(clave)) g += rareza.get(clave) ?? 0
  }
  return Math.min(g, TOPE_COMPARTIR)
}

/** Cuántas candidatas distintas del reparto piden cada ingrediente. */
function rarezaDeLasCandidatas(huecos: Hueco[]): Map<string, number> {
  const vistas = new Set<string>()
  const veces = new Map<string, number>()
  for (const hueco of huecos) {
    for (const receta of hueco.candidatos) {
      if (vistas.has(receta.id)) continue
      vistas.add(receta.id)
      for (const clave of clavesDe(receta)) veces.set(clave, (veces.get(clave) ?? 0) + 1)
    }
  }
  return new Map([...veces].map(([clave, n]) => [clave, rarezaDe(n)]))
}

function penalizacion(receta: RecetaListada, a: Aporte, acc: Acumulado, ajustes: Ajustes): number {
  const { pesos, techos, favoritas } = ajustes
  let p = 0

  if (receta.categoria) {
    const cuota = favoritas.has(receta.categoria) ? ajustes.cuotaFavorita : 1
    const usos = acc.cocinas.get(receta.categoria) ?? 0
    if (usos >= cuota) p += pesos.cocinaRepetida * (1 + usos - cuota)
    if (favoritas.size > 0 && !favoritas.has(receta.categoria)) p += pesos.noFavorita
  }

  const verdura = verduraDe(receta)
  if (!verdura) p += pesos.sinVerdura
  else if (acc.verduras.has(verdura)) p += pesos.verduraRepetida

  if ((acc.sabores.get(receta.sabor) ?? 0) >= 3) p += pesos.saborRepetido

  for (const clave of Object.keys(techos) as Techo[]) {
    const techo = techos[clave]
    if (Number.isFinite(techo) && a[clave] > techo) {
      p += PESO_TECHO[clave] * ((a[clave] - techo) / techo)
    }
  }

  const conElPlato = Object.fromEntries(
    MACROS.map((m) => [m, acc.macros[m] + a[m]])
  ) as Record<Macro, number>
  p += pesos.reparto * desvioReparto(conElPlato)

  return p
}

/** Un sitio que llenar: un día de la semana, o el desayuno de ese día. */
export interface Hueco {
  id: string
  /** Candidatas que cumplen los límites de este hueco concreto. */
  candidatos: RecetaListada[]
  dia?: string
}

interface Reparto {
  porHueco: Map<string, RecetaListada>
  /** Huecos que han tenido que repetir un plato porque no quedaban candidatas. */
  repetidos: Set<string>
  /** Lo que hay en casa y la semana se va a gastar, por su nombre en la despensa. */
  aprovechados: string[]
}

interface OpcionesReparto {
  preferencias?: Preferencias
  /** Platos que ya están puestos y no se tocan: los cocinados. */
  yaEnLaSemana?: RecetaListada[]
  /** Lo que hay en casa, para preferir los platos que lo gastan. */
  despensa?: ItemAprovechable[]
  /** Recetas que se quitaron del plan a mano: no se vetan, pesan en contra. */
  descartados?: Iterable<string>
  /** Lo que colocó la pasada anterior, para que volver a pulsar cambie la semana. */
  yaPropuestos?: Iterable<string>
  proteinaPorDia?: Map<string, number>
  semilla?: number
}

export function repartirSemana(huecos: Hueco[], opciones: OpcionesReparto = {}): Reparto {
  const { preferencias, yaEnLaSemana = [], despensa = [], semilla = Date.now() } = opciones
  const descartados = new Set(opciones.descartados ?? [])
  const yaPropuestos = new Set(opciones.yaPropuestos ?? [])
  const aleatorio = prng(semilla)
  const ajustes = ajustesDe(preferencias, huecos.length + yaEnLaSemana.length)

  const indice = indiceDespensa(despensa)
  const rareza = rarezaDeLasCandidatas(huecos)
  const cacheUsados = new Map<string, number[]>()
  const usadosDe = (receta: RecetaListada): number[] => {
    if (indice.items.length === 0) return []
    let usados = cacheUsados.get(receta.id)
    if (!usados) {
      usados = aprovechaDe(receta, indice)
      cacheUsados.set(receta.id, usados)
    }
    return usados
  }

  // Lo cocinado no reserva despensa: si su bote sigue en la lista es que quedó,
  // y quedarse sin gastar es justo lo que hay que arreglar esta semana.
  const acc = acumuladoVacio()
  for (const receta of yaEnLaSemana) acumular(acc, receta)
  for (const [dia, gramos] of opciones.proteinaPorDia ?? []) acc.proteinaPorDia.set(dia, gramos)

  // Lo ya cocinado no se vuelve a proponer ni cuando toca repetir: acabas de
  // comértelo. Si hay que repetir, se repite de lo elegido en esta pasada.
  const intocables = new Set(yaEnLaSemana.map((r) => r.id))
  const usadas = new Set(intocables)
  const porHueco = new Map<string, RecetaListada>()
  const repetidos = new Set<string>()

  const orden = huecos
    .map((hueco, i) => ({ hueco, i }))
    .sort((a, b) => a.hueco.candidatos.length - b.hueco.candidatos.length || a.i - b.i)

  for (const { hueco } of orden) {
    const libres = hueco.candidatos.filter((r) => !usadas.has(r.id))
    // Sin candidatas nuevas se repite un plato antes que dejar el día vacío: en
    // una casa eso son sobras, no un fallo. Quien llama lo cuenta.
    const entre = libres.length > 0 ? libres : hueco.candidatos.filter((r) => !intocables.has(r.id))
    if (entre.length === 0) continue
    if (libres.length === 0) repetidos.add(hueco.id)

    let mejor = entre[0]
    let mejorNota = -Infinity
    for (const receta of entre) {
      const a = aporteDe(receta)
      const nota =
        ganancia(a, acc, ajustes, hueco.dia) +
        ajustes.pesos.aprovechar * gananciaDespensa(usadosDe(receta), acc, indice) +
        ajustes.pesos.compartir * gananciaCompartir(receta, acc, rareza) -
        penalizacion(receta, a, acc, ajustes) -
        (descartados.has(receta.id) ? PENALIZACION_DESCARTADO : 0) -
        (yaPropuestos.has(receta.id) ? PENALIZACION_YA_PROPUESTO : 0) +
        aleatorio() * 0.25
      if (nota > mejorNota) {
        mejorNota = nota
        mejor = receta
      }
    }

    acumular(acc, mejor, usadosDe(mejor), hueco.dia)
    usadas.add(mejor.id)
    porHueco.set(hueco.id, mejor)
  }

  return {
    porHueco,
    repetidos,
    aprovechados: [...acc.aprovechados].map((i) => indice.items[i].nombre),
  }
}

interface Cobertura {
  clave: Clave
  aportado: number
  objetivo: number
  /** 1 = la semana llega al objetivo. */
  ratio: number
}

interface Exceso {
  clave: Techo
  media: number
  techo: number
}

interface ResumenSemana {
  coberturas: Cobertura[]
  excesos: Exceso[]
  platos: number
}

export function resumenSemana(recetas: RecetaListada[], preferencias?: Preferencias): ResumenSemana {
  const ajustes = ajustesDe(preferencias, recetas.length || 1)
  const acc = acumuladoVacio()
  for (const receta of recetas) acumular(acc, receta)

  const coberturas = CLAVES.map((clave) => ({
    clave,
    aportado: acc.nutrientes[clave],
    objetivo: ajustes.objetivos[clave],
    ratio: ajustes.objetivos[clave] > 0 ? acc.nutrientes[clave] / ajustes.objetivos[clave] : 0,
  }))

  const excesos: Exceso[] = []
  if (recetas.length > 0) {
    for (const clave of Object.keys(ajustes.techos) as Techo[]) {
      const techo = ajustes.techos[clave]
      if (!Number.isFinite(techo)) continue
      const media = recetas.reduce((t, r) => t + aporteDe(r)[clave], 0) / recetas.length
      if (media > techo) excesos.push({ clave, media, techo })
    }
  }

  return { coberturas, excesos, platos: recetas.length }
}

export function semanaEquilibrada(
  recetas: RecetaListada[],
  n: number,
  semilla = Date.now(),
  yaEnLaSemana: RecetaListada[] = [],
  preferencias?: Preferencias,
  despensa: ItemAprovechable[] = []
): RecetaListada[] {
  const huecos = Array.from({ length: n }, (_, i) => ({ id: String(i), candidatos: recetas }))
  const { porHueco, repetidos } = repartirSemana(huecos, { preferencias, yaEnLaSemana, semilla, despensa })
  return huecos
    .filter((h) => porHueco.has(h.id) && !repetidos.has(h.id))
    .map((h) => porHueco.get(h.id)!)
}
