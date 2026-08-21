import type { RecetaListada } from '../types/receta'
import type { Preferencias, Prioridad } from '../types/preferencias'
import { aprovechaDe, indiceDespensa, type IndiceDespensa, type ItemAprovechable } from './aprovechamiento'

// Lo que debería traer **una comida**, no un día entero: es en torno a un tercio
// de las referencias para un adulto (fibra 25-30 g/día, vitamina C 110 mg, calcio
// 950 mg, folato 330 µg, hierro 11 mg, B12 4 µg) y de los 130 g de proteína que
// fija `entrenador-personal`.
//
// Estaba escrito como objetivo diario y multiplicado por siete días, que era
// correcto mientras el plan repartía una sola comida al día. Con los tres huecos
// puestos dejó de serlo: un principal de 43 g saturaba él solo la proteína del
// día entero y el reparto dejaba de valorarla en las otras dos comidas. Ahora
// escala con los huecos que el plan llena, así que una semana de siete cenas
// mide igual que antes y una de veintiuna comidas mide lo que de verdad pide.
const DIAS_SEMANA = 7

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

// Techos por ración. Por encima, el plato penaliza en proporción a lo que se
// pasa. Los de serie son holgados a propósito: el que aprieta de verdad es el
// que se elige como prioridad.
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
}

/**
 * Cuánta despensa se le reconoce a un plato como mucho. Sin tope, un guiso que
 * toca ocho cosas de la nevera ganaba siempre, aunque dejara la semana entera
 * sin verdura: aprovechar es un motivo para elegir un plato, no una excusa para
 * comer mal. Con el tope, gastar lo que caduca vale como el mayor de los pesos
 * de la tabla de arriba, ni más.
 */
const TOPE_APROVECHAMIENTO = 2

/**
 * Lo que pesa la memoria de las pasadas anteriores. Las dos penalizan en vez de
 * filtrar: con el recetario justo, un plato que quitaste sigue siendo mejor que
 * un día vacío. Quitar a mano pesa lo bastante como para que no vuelva salvo que
 * no quede nada; haber salido en la pasada anterior solo lo empuja al banquillo,
 * así que volver a pulsar da otra semana sin arrasar con la calidad.
 */
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

// Reparto de referencia de la energía de la semana. No es un dogma: es el punto
// medio del recetario (principales de 35-45 g de proteína) y lo que evita que la
// semana se vaya entera a pasta o entera a fritura.
const MACROS = ['proteinas', 'carbohidratos', 'grasas'] as const
type Macro = typeof MACROS[number]

const REPARTO: Record<Macro, number> = { proteinas: 0.3, carbohidratos: 0.4, grasas: 0.3 }
const KCAL_POR_GRAMO: Record<Macro, number> = { proteinas: 4, carbohidratos: 4, grasas: 9 }

const FAMILIA_VERDURA = 'verduras'

export interface Aporte extends Record<Clave, number>, Record<Techo, number> {
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

/**
 * La verdura del plato. Mira primero la guarnición, que es donde va casi siempre,
 * y si no la hay busca en los ingredientes del propio plato: un guiso de lentejas
 * con puerro y zanahoria no es un plato sin verdura, y contarlo como tal era
 * penalizar justo a los platos que se quieren.
 */
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

export interface Ajustes {
  objetivos: Record<Clave, number>
  techos: Record<Techo, number>
  pesos: Record<Peso, number>
  favoritas: Set<string>
  /** Cuántas veces puede salir una cocina favorita sin que penalice. */
  cuotaFavorita: number
}

/**
 * Traduce las preferencias a números. `huecos` es cuántos platos se van a elegir,
 * y manda dos veces. En la cuota de cocina, porque con cuatro favoritas y siete
 * días alguna tiene que repetir y castigar lo que la propia elección obliga no
 * tiene sentido. Y en los objetivos de nutrientes, que son por comida: siete
 * cenas piden siete veces menos que las veintiuna comidas de una semana entera.
 */
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

  // Una semana sin carne ni pescado parte con el techo de proteína más bajo:
  // sus platos rondan los 25 g por ración en vez de los 35, y el recetario ya
  // no los descarta por eso. Para que ese margen no se pierda por el camino, la
  // dieta empuja la proteína igual que la prioridad "proteína": entre dos
  // platos veganos gana el que más trae, que es donde se maximiza de verdad.
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
}

function acumuladoVacio(): Acumulado {
  return {
    nutrientes: Object.fromEntries(CLAVES.map((c) => [c, 0])) as Record<Clave, number>,
    macros: Object.fromEntries(MACROS.map((m) => [m, 0])) as Record<Macro, number>,
    cocinas: new Map(),
    verduras: new Set(),
    sabores: new Map(),
    aprovechados: new Set(),
  }
}

function acumular(acc: Acumulado, receta: RecetaListada, usados: number[] = []) {
  for (const i of usados) acc.aprovechados.add(i)
  const a = aporteDe(receta)
  for (const clave of CLAVES) acc.nutrientes[clave] += a[clave]
  for (const macro of MACROS) acc.macros[macro] += a[macro]
  if (receta.categoria) acc.cocinas.set(receta.categoria, (acc.cocinas.get(receta.categoria) ?? 0) + 1)
  const verdura = verduraDe(receta)
  if (verdura) acc.verduras.add(verdura)
  acc.sabores.set(receta.sabor, (acc.sabores.get(receta.sabor) ?? 0) + 1)
}

// Cuánto se desvía el reparto de energía acumulado del de referencia, de 0
// (clavado) a 1 (todo en un macro). Una semana sin macros declarados no se
// desvía: no hay dato que juzgar, y castigarla la dejaría siempre por debajo de
// las que sí lo traen.
function desvioReparto(acumulado: Record<Macro, number>): number {
  const kcal = MACROS.reduce((t, m) => t + acumulado[m] * KCAL_POR_GRAMO[m], 0)
  if (kcal === 0) return 0
  const suma = MACROS.reduce(
    (t, m) => t + Math.abs((acumulado[m] * KCAL_POR_GRAMO[m]) / kcal - REPARTO[m]),
    0
  )
  return suma / 2
}

function ganancia(a: Aporte, acc: Acumulado, ajustes: Ajustes): number {
  let g = 0
  for (const clave of CLAVES) {
    const objetivo = ajustes.objetivos[clave]
    const antes = Math.min(acc.nutrientes[clave], objetivo)
    const despues = Math.min(acc.nutrientes[clave] + a[clave], objetivo)
    g += (despues - antes) / objetivo
  }
  return g
}

/**
 * Lo que el plato salva de la despensa que la semana no haya salvado ya. Cuenta
 * cada ítem una vez: si el lunes se lleva el brik de nata abierto, el martes no
 * puntúa por el mismo brik, igual que un nutriente deja de sumar cuando la
 * semana ya llega a su objetivo.
 */
function gananciaDespensa(usados: number[], acc: Acumulado, indice: IndiceDespensa): number {
  let g = 0
  for (const i of usados) {
    if (!acc.aprovechados.has(i)) g += indice.pesos[i]
  }
  return Math.min(g, TOPE_APROVECHAMIENTO)
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

  // Lo que se pasa de cada techo, en proporción al propio techo: así el mismo
  // plato apenas roza el techo de serie y pesa de verdad cuando se ha pedido
  // "menos sal" y el techo baja a la mitad.
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
}

export interface Reparto {
  porHueco: Map<string, RecetaListada>
  /** Huecos que han tenido que repetir un plato porque no quedaban candidatas. */
  repetidos: Set<string>
  /** Lo que hay en casa y la semana se va a gastar, por su nombre en la despensa. */
  aprovechados: string[]
}

export interface OpcionesReparto {
  preferencias?: Preferencias
  /** Platos que ya están puestos y no se tocan: los cocinados. */
  yaEnLaSemana?: RecetaListada[]
  /** Lo que hay en casa, para preferir los platos que lo gastan. */
  despensa?: ItemAprovechable[]
  /** Recetas que se quitaron del plan a mano: no se vetan, pesan en contra. */
  descartados?: Iterable<string>
  /** Lo que colocó la pasada anterior, para que volver a pulsar cambie la semana. */
  yaPropuestos?: Iterable<string>
  semilla?: number
}

/**
 * Reparte platos por huecos manteniendo una sola cuenta de la semana. Los huecos
 * más estrechos se llenan primero: si el martes solo admite platos de 20 minutos
 * y el sábado admite cualquiera, elegir antes por el martes evita gastarle sus
 * cuatro opciones a un día que no las necesitaba.
 */
export function repartirSemana(huecos: Hueco[], opciones: OpcionesReparto = {}): Reparto {
  const { preferencias, yaEnLaSemana = [], despensa = [], semilla = Date.now() } = opciones
  const descartados = new Set(opciones.descartados ?? [])
  const yaPropuestos = new Set(opciones.yaPropuestos ?? [])
  const aleatorio = prng(semilla)
  // Lo ya cocinado cuenta en los huecos porque cuenta en el acumulado: si el
  // lunes ya está puesto, su proteína suma y su cocina ocupa cuota, así que
  // dejarlo fuera de la cuenta encogería el objetivo de la semana entera.
  const ajustes = ajustesDe(preferencias, huecos.length + yaEnLaSemana.length)

  // Qué gasta cada receta de la despensa se resuelve una vez por receta y no una
  // por hueco: la misma candidata se mira en los siete días, y cada mirada son
  // sus ingredientes contra la despensa entera.
  const indice = indiceDespensa(despensa)
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
        ganancia(a, acc, ajustes) +
        ajustes.pesos.aprovechar * gananciaDespensa(usadosDe(receta), acc, indice) -
        penalizacion(receta, a, acc, ajustes) -
        (descartados.has(receta.id) ? PENALIZACION_DESCARTADO : 0) -
        (yaPropuestos.has(receta.id) ? PENALIZACION_YA_PROPUESTO : 0) +
        aleatorio() * 0.25
      if (nota > mejorNota) {
        mejorNota = nota
        mejor = receta
      }
    }

    acumular(acc, mejor, usadosDe(mejor))
    usadas.add(mejor.id)
    porHueco.set(hueco.id, mejor)
  }

  return {
    porHueco,
    repetidos,
    aprovechados: [...acc.aprovechados].map((i) => indice.items[i].nombre),
  }
}

export interface Cobertura {
  clave: Clave
  aportado: number
  objetivo: number
  /** 1 = la semana llega al objetivo. */
  ratio: number
}

export interface Exceso {
  clave: Techo
  media: number
  techo: number
}

export interface ResumenSemana {
  coberturas: Cobertura[]
  excesos: Exceso[]
  platos: number
}

/**
 * Qué trae la semana puesta, para poder contarla en vez de enseñar un número.
 * No es una nota ni un aprobado: es de dónde viene cada cosa y qué se queda
 * corto, que es lo único accionable.
 */
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

/**
 * Elige `n` platos de un mismo montón. `yaEnLaSemana` son los que ya están
 * puestos y no se tocan (los cocinados): entran en el cálculo como si los hubiese
 * elegido esta misma función, así que lo que devuelve compensa lo que les falta y
 * no repite ni su cocina, ni su verdura, ni el plato en sí.
 */
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
