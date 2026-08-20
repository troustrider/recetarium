import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react'
import type { RecetaListada } from '../types/receta'
import { useListaCompraContext } from './ListaCompraContext'
import { useRecetasContext } from './RecetasContext'
import { usePendientesPlan } from './PendientesPlanContext'
import { getPlan, savePlan, type EntradaPlanDTO } from '../api/estado'
import { useEstadoCompartido } from '../hooks/useEstadoCompartido'
import { racionesBase } from '../hooks/useListaCompra'
import { repartirSemana, type Hueco } from '../utils/semana'
import { candidatas } from '../utils/candidatas'
import {
  ORDEN_MOMENTO,
  esMomento,
  momentoDe,
  momentoPorDefecto,
  type Momento,
} from '../utils/momentos'
import type { ItemAprovechable } from '../utils/aprovechamiento'
import { usePreferencias } from './PreferenciasContext'
import type { Preferencias } from '../types/preferencias'

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const
export type Dia = typeof DIAS[number]

const FINDE: readonly Dia[] = ['Sábado', 'Domingo']

const esDesayuno = (receta: RecetaListada) => receta.tipo === 'desayuno'
const esPrincipal = (receta: RecetaListada) => (receta.tipo ?? 'principal') === 'principal'

/**
 * Qué ha pasado al rellenar la semana. Un generador que se explica es la
 * diferencia entre una herramienta y una caja negra: si ha tenido que repetir
 * plato o ensanchar el tiempo, se dice, en vez de devolver una semana peor sin
 * avisar.
 */
export interface InformeSemana {
  comidas: number
  cenas: number
  desayunos: number
  conservados: number
  repetidos: number
  tiempoEnsanchado: boolean
  huecosVacios: number
  /** Lo que había en casa y la semana se va a gastar, por su nombre. */
  aprovechados: string[]
}

const INFORME_VACIO: InformeSemana = {
  comidas: 0, cenas: 0, desayunos: 0, conservados: 0, repetidos: 0,
  tiempoEnsanchado: false, huecosVacios: 0, aprovechados: [],
}

/**
 * Reparte n desayunos por la semana sin amontonarlos: tres desayunos son lunes,
 * miércoles y sábado, no lunes, martes y miércoles.
 */
function repartidos(dias: Dia[], n: number): Dia[] {
  if (n >= dias.length) return dias
  const paso = dias.length / n
  return Array.from({ length: n }, (_, i) => dias[Math.floor(i * paso)])
}

export interface EntradaPlan {
  id: string
  receta: RecetaListada
  raciones: number
  cocinada?: boolean
  conGuarnicion?: boolean
  /**
   * En qué hueco del día se come. Puede faltar —entradas guardadas antes de que
   * el plan distinguiera comida y cena—, y quien lo lee usa `momentoDe`, que lo
   * deduce en vez de tratarlas como un caso raro.
   */
  momento?: Momento
}

type Plan = Record<Dia, EntradaPlan[]>

const PLAN_VACIO: Plan = Object.fromEntries(DIAS.map((d) => [d, []])) as unknown as Plan

/** El día se lee como se vive: el desayuno antes que la comida y que la cena. */
const porMomento = (a: EntradaPlan, b: EntradaPlan) =>
  ORDEN_MOMENTO[momentoDe(a)] - ORDEN_MOMENTO[momentoDe(b)]

function serializar(plan: Plan): EntradaPlanDTO[] {
  const out: EntradaPlanDTO[] = []
  for (const dia of DIAS) {
    for (const e of plan[dia]) {
      out.push({
        dia,
        recetaId: e.receta.id,
        raciones: e.raciones,
        momento: momentoDe(e),
        ...(e.cocinada ? { cocinada: true } : {}),
        ...(e.conGuarnicion ? { conGuarnicion: true } : {}),
      })
    }
  }
  return out
}

function hidratar(dtos: EntradaPlanDTO[], recetas: RecetaListada[]): Plan {
  const byId = new Map(recetas.map((r) => [r.id, r]))
  const result = Object.fromEntries(DIAS.map((d) => [d, []])) as unknown as Plan
  for (const { dia, recetaId, raciones, cocinada, conGuarnicion, momento } of dtos) {
    const receta = byId.get(recetaId)
    if (!receta || !DIAS.includes(dia as Dia)) continue
    result[dia as Dia].push({
      id: `${dia}-${recetaId}-${Date.now()}-${Math.random()}`,
      receta,
      raciones,
      momento: esMomento(momento) ? momento : momentoPorDefecto(receta.tipo),
      ...(cocinada ? { cocinada: true } : {}),
      ...(conGuarnicion ? { conGuarnicion: true } : {}),
    })
  }
  for (const dia of DIAS) result[dia].sort(porMomento)
  return result
}

interface PlanificadorCtx {
  plan: Plan
  dias: readonly Dia[]
  añadir: (dia: Dia, receta: RecetaListada, raciones?: number, momento?: Momento) => void
  quitar: (dia: Dia, entradaId: string) => void
  setRaciones: (dia: Dia, entradaId: string, raciones: number) => void
  setMomento: (dia: Dia, entradaId: string, momento: Momento) => void
  setGuarnicionPlan: (dia: Dia, entradaId: string, conGuarnicion: boolean) => void
  marcarCocinada: (dia: Dia, entradaId: string, cocinada: boolean) => void
  mover: (desdeDia: Dia, hastaDia: Dia, entradaId: string) => void
  limpiar: () => void
  autollenar: (recetas: RecetaListada[], raciones: number, despensa?: ItemAprovechable[]) => InformeSemana
  restaurarPlan: (anterior: Plan) => void
}

export type { Plan }

const PlanificadorContext = createContext<PlanificadorCtx | null>(null)

export function PlanificadorProvider({ children }: { children: ReactNode }) {
  const { recetas, loading } = useRecetasContext()

  // Entradas cuya receta no está en el catálogo, casi siempre una borrada que
  // sigue en la papelera. Se guardan aparte para no perderlas al reescribir el
  // plan: si se restaura la receta, su día vuelve con ella.
  const huerfanasRef = useRef<EntradaPlanDTO[]>([])

  const [plan, cambiarPlan] = useEstadoCompartido<Plan, EntradaPlanDTO[]>({
    nombre: 'el plan de la semana',
    inicial: PLAN_VACIO,
    listo: !loading && recetas.length > 0,
    cargar: getPlan,
    guardar: savePlan,
    serializar: (p) => [...serializar(p), ...huerfanasRef.current],
    hidratar: (dtos) => {
      const conocidas = new Set(recetas.map((r) => r.id))
      huerfanasRef.current = dtos.filter((d) => !conocidas.has(d.recetaId))
      return hidratar(dtos, recetas)
    },
  })

  const { seleccionadas, toggleReceta, setRaciones: setRacionesLista, setGuarnicion: setGuarnicionLista, estaSeleccionada } = useListaCompraContext()
  const { pendientes, quitarPendiente } = usePendientesPlan()

  // El planificador lee las preferencias pero no se re-renderiza por ellas: solo
  // las necesita en el momento de generar la semana.
  const { preferencias } = usePreferencias()
  const preferenciasRef = useRef<Preferencias>(preferencias)
  useEffect(() => { preferenciasRef.current = preferencias }, [preferencias])

  const seleccionadasRef = useRef(seleccionadas)
  const estaSeleccionadaRef = useRef(estaSeleccionada)
  useEffect(() => { seleccionadasRef.current = seleccionadas }, [seleccionadas])
  useEffect(() => { estaSeleccionadaRef.current = estaSeleccionada }, [estaSeleccionada])

  const planIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const totales = new Map<string, { receta: RecetaListada; raciones: number; conGuarnicion: boolean }>()
    for (const dia of DIAS) {
      for (const { receta, raciones, cocinada, conGuarnicion } of plan[dia]) {
        if (cocinada) continue
        const prev = totales.get(receta.id)
        totales.set(receta.id, {
          receta,
          raciones: (prev?.raciones ?? 0) + raciones,
          conGuarnicion: (prev?.conGuarnicion ?? false) || !!conGuarnicion,
        })
      }
    }

    for (const [, { receta, raciones, conGuarnicion }] of totales) {
      if (!estaSeleccionadaRef.current(receta.id)) {
        toggleReceta(receta)
      }
      setRacionesLista(receta.id, raciones)
      setGuarnicionLista(receta.id, conGuarnicion)
    }

    for (const prevId of planIdsRef.current) {
      if (!totales.has(prevId)) {
        const entrada = seleccionadasRef.current.find((e) => e.receta.id === prevId)
        if (entrada) toggleReceta(entrada.receta)
      }
    }

    planIdsRef.current = new Set(totales.keys())
  }, [plan]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (pendientes.length === 0) return
    const enPlan = new Set<string>()
    for (const dia of DIAS) for (const e of plan[dia]) enPlan.add(e.receta.id)
    for (const p of pendientes) {
      if (enPlan.has(p.receta.id)) quitarPendiente(p.receta.id)
    }
  }, [plan, pendientes, quitarPendiente])

  const añadir = useCallback((
    dia: Dia,
    receta: RecetaListada,
    raciones = racionesBase(receta),
    momento: Momento = momentoPorDefecto(receta.tipo)
  ) => {
    cambiarPlan((prev) => ({
      ...prev,
      [dia]: [
        ...prev[dia],
        { id: `${dia}-${receta.id}-${Date.now()}`, receta, raciones, momento },
      ].sort(porMomento),
    }))
  }, [cambiarPlan])

  const quitar = useCallback((dia: Dia, entradaId: string) => {
    cambiarPlan((prev) => ({
      ...prev,
      [dia]: prev[dia].filter((e) => e.id !== entradaId),
    }))
  }, [cambiarPlan])

  // El techo nunca puede quedar por debajo de las porciones de la receta: si no,
  // una receta de 6 bajaba sola a 4 al primer toque del stepper.
  const setRaciones = useCallback((dia: Dia, entradaId: string, raciones: number) => {
    cambiarPlan((prev) => ({
      ...prev,
      [dia]: prev[dia].map((e) =>
        e.id === entradaId
          ? { ...e, raciones: Math.max(1, Math.min(Math.max(4, racionesBase(e.receta)), raciones)) }
          : e
      ),
    }))
  }, [cambiarPlan])

  const setMomento = useCallback((dia: Dia, entradaId: string, momento: Momento) => {
    cambiarPlan((prev) => ({
      ...prev,
      [dia]: prev[dia]
        .map((e) => (e.id === entradaId ? { ...e, momento } : e))
        .sort(porMomento),
    }))
  }, [cambiarPlan])

  const setGuarnicionPlan = useCallback((dia: Dia, entradaId: string, conGuarnicion: boolean) => {
    cambiarPlan((prev) => ({
      ...prev,
      [dia]: prev[dia].map((e) => (e.id === entradaId ? { ...e, conGuarnicion } : e)),
    }))
  }, [cambiarPlan])

  const marcarCocinada = useCallback((dia: Dia, entradaId: string, cocinada: boolean) => {
    cambiarPlan((prev) => ({
      ...prev,
      [dia]: prev[dia].map((e) => (e.id === entradaId ? { ...e, cocinada } : e)),
    }))
  }, [cambiarPlan])

  const mover = useCallback((desdeDia: Dia, hastaDia: Dia, entradaId: string) => {
    if (desdeDia === hastaDia) return
    cambiarPlan((prev) => {
      const entrada = prev[desdeDia].find((e) => e.id === entradaId)
      if (!entrada) return prev
      return {
        ...prev,
        [desdeDia]: prev[desdeDia].filter((e) => e.id !== entradaId),
        [hastaDia]: [...prev[hastaDia], entrada].sort(porMomento),
      }
    })
  }, [cambiarPlan])

  const limpiar = useCallback(() => {
    huerfanasRef.current = []
    cambiarPlan(PLAN_VACIO)
  }, [cambiarPlan])

  // Rehacer la semana respeta lo ya cocinado: ese plato ya se comió y ya se
  // descontó de la despensa, así que borrarlo sería mentir sobre lo que pasó. Lo
  // demás se sustituye, y lo cocinado entra en el cálculo del resto para que la
  // semana salga equilibrada contando lo que ya hay, no desde cero.
  const autollenar = useCallback((
    recetas: RecetaListada[],
    raciones: number,
    despensa: ItemAprovechable[] = []
  ): InformeSemana => {
    if (recetas.length === 0) return INFORME_VACIO
    const prefs = preferenciasRef.current
    const { limites } = prefs

    const nuevo = Object.fromEntries(
      DIAS.map((d) => [d, plan[d].filter((e) => e.cocinada)])
    ) as unknown as Plan
    const conservadas = DIAS.flatMap((d) => nuevo[d])
    const hechas = conservadas.map((e) => e.receta)

    // Los huecos ya ocupados se miran por momento y no por tipo de receta: si
    // el lunes ya tienes puesta la comida, lo que falta ese día es la cena, no
    // "un principal".
    const ocupado = (dia: Dia, momento: Momento) => nuevo[dia].some((e) => momentoDe(e) === momento)
    const repartirLos = (momento: Momento, cuantos: number) => {
      const puestos = DIAS.filter((d) => ocupado(d, momento))
      const faltan = Math.max(0, Math.min(cuantos, DIAS.length) - puestos.length)
      return repartidos(DIAS.filter((d) => !puestos.includes(d)), faltan)
    }

    // La cena la lleva la semana entera; la comida, los días que se hayan
    // pedido. Los dos huecos beben del mismo montón de principales, y quien
    // reparte se encarga de que no salga el mismo plato dos veces.
    const diasSinCena = DIAS.filter((d) => !ocupado(d, 'cena'))
    const diasConComida = repartirLos('comida', prefs.comidas)
    const diasConDesayuno = repartirLos('desayuno', prefs.desayunos)

    const principales = recetas.filter(esPrincipal)
    const desayunos = recetas.filter(esDesayuno)

    // El tiempo es el único límite que se ensancha: si el catálogo no da siete
    // platos distintos con el techo puesto, antes que repetir seis veces el mismo
    // se sueltan los minutos. La dieta, el gluten y los vetos no se tocan.
    const topeDe = (dia: Dia) => (FINDE.includes(dia) ? limites.tiempoMaxFinde : limites.tiempoMax)
    const construir = (dias: Dia[], momento: Momento, pool: RecetaListada[], conTiempo: boolean): Hueco[] =>
      dias.map((dia) => ({
        id: `${dia}:${momento}`,
        candidatos: candidatas(pool, limites, conTiempo ? topeDe(dia) : null),
      }))

    const distintas = (huecos: Hueco[]) =>
      new Set(huecos.flatMap((h) => h.candidatos.map((r) => r.id))).size

    const construirPrincipales = (conTiempo: boolean) => [
      ...construir(diasConComida, 'comida', principales, conTiempo),
      ...construir(diasSinCena, 'cena', principales, conTiempo),
    ]

    let huecosPrincipales = construirPrincipales(true)
    let tiempoEnsanchado = false
    const estrictas = distintas(huecosPrincipales)
    if (estrictas < huecosPrincipales.length) {
      const sinTope = construirPrincipales(false)
      // Solo se salta el tiempo si saltárselo resuelve algo: llenar la semana
      // entera, o poder llenar algo cuando con el techo puesto no cabe nada.
      // Servir un guiso de dos horas un martes para ahorrarse una repetición es
      // peor que la repetición.
      if (distintas(sinTope) >= huecosPrincipales.length || estrictas === 0) {
        huecosPrincipales = sinTope
        tiempoEnsanchado = distintas(sinTope) > estrictas
      }
    }

    const huecosDesayuno = construir(
      diasConDesayuno,
      'desayuno',
      desayunos,
      // Un desayuno de 40 minutos un martes no lo hace nadie, pero el techo de la
      // cena no es su techo: se les aplica solo si el de entre semana es holgado.
      false
    )

    const huecos = [...huecosPrincipales, ...huecosDesayuno]
    if (huecos.length === 0) {
      huerfanasRef.current = huerfanasRef.current.filter((d) => d.cocinada)
      cambiarPlan(nuevo)
      return { ...INFORME_VACIO, conservados: conservadas.length }
    }

    const { porHueco, repetidos, aprovechados } = repartirSemana(huecos, {
      preferencias: prefs,
      yaEnLaSemana: hechas,
      despensa,
    })

    for (const hueco of huecos) {
      const receta = porHueco.get(hueco.id)
      if (!receta) continue
      const [dia, momento] = hueco.id.split(':') as [Dia, Momento]
      nuevo[dia] = [...nuevo[dia], {
        id: `${hueco.id}-${receta.id}-${Date.now()}-${Math.random()}`,
        receta,
        raciones,
        momento,
        ...(receta.guarnicion ? { conGuarnicion: true } : {}),
      }]
    }

    for (const dia of DIAS) nuevo[dia] = [...nuevo[dia]].sort(porMomento)

    huerfanasRef.current = huerfanasRef.current.filter((d) => d.cocinada)
    cambiarPlan(nuevo)

    const llenos = (grupo: Hueco[]) => grupo.filter((h) => porHueco.has(h.id)).length

    return {
      comidas: llenos(huecosPrincipales.filter((h) => h.id.endsWith(':comida'))),
      cenas: llenos(huecosPrincipales.filter((h) => h.id.endsWith(':cena'))),
      desayunos: llenos(huecosDesayuno),
      conservados: conservadas.length,
      repetidos: repetidos.size,
      tiempoEnsanchado,
      huecosVacios: huecos.filter((h) => !porHueco.has(h.id)).length,
      aprovechados,
    }
  }, [cambiarPlan, plan])

  const restaurarPlan = useCallback((anterior: Plan) => {
    cambiarPlan(anterior)
  }, [cambiarPlan])

  const valor = useMemo(
    () => ({ plan, dias: DIAS, añadir, quitar, setRaciones, setMomento, setGuarnicionPlan, marcarCocinada, mover, limpiar, autollenar, restaurarPlan }),
    [plan, añadir, quitar, setRaciones, setMomento, setGuarnicionPlan, marcarCocinada, mover, limpiar, autollenar, restaurarPlan]
  )

  return <PlanificadorContext.Provider value={valor}>{children}</PlanificadorContext.Provider>
}

export function usePlanificador() {
  const ctx = useContext(PlanificadorContext)
  if (!ctx) throw new Error('usePlanificador fuera de PlanificadorProvider')
  return ctx
}
