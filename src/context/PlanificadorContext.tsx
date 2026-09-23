import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react'
import type { RecetaListada } from '../types/receta'
import { useListaCompraContext } from './ListaCompraContext'
import { useRecetasContext } from './RecetasContext'
import { usePendientesPlan } from './PendientesPlanContext'
import { getPlan, savePlan, type EntradaPlanDTO } from '../api/estado'
import { useEstadoCompartido } from '../hooks/useEstadoCompartido'
import { racionesBase } from '../hooks/useListaCompra'
import { aporteDe, huecosConPlatoPropio, repartirSemana, type Hueco } from '../utils/semana'
import { candidatas } from '../utils/candidatas'
import { guarnicionesDe } from '../utils/ingredientes'
import {
  ORDEN_MOMENTO,
  cabeDeNoche,
  esMomento,
  momentoDe,
  momentoPorDefecto,
  type Momento,
} from '../utils/momentos'
import type { ItemAprovechable } from '../utils/aprovechamiento'
import { usePreferencias } from './PreferenciasContext'
import type { LimitesSemana, Preferencias } from '../types/preferencias'
import { guarnicionPara } from '../utils/nutricion'

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const
export type Dia = typeof DIAS[number]

const FINDE: readonly Dia[] = ['Sábado', 'Domingo']

const esDesayuno = (receta: RecetaListada) => receta.tipo === 'desayuno'
const esPrincipal = (receta: RecetaListada) => (receta.tipo ?? 'principal') === 'principal'

export interface InformeSemana {
  comidas: number
  cenas: number
  desayunos: number
  conservados: number
  /** Platos de "compradas · por planificar" que la pasada ha metido en la semana. */
  compradas: number
  repetidos: number
  tiempoEnsanchado: boolean
  /** Si la cena ha tenido que aceptar platos que se pasan de `TOPE_CENA`. */
  cenaEnsanchada: boolean
  huecosVacios: number
  /** Lo que había en casa y la semana se va a gastar, por su nombre. */
  aprovechados: string[]
}

const INFORME_VACIO: InformeSemana = {
  comidas: 0, cenas: 0, desayunos: 0, conservados: 0, compradas: 0, repetidos: 0,
  tiempoEnsanchado: false, cenaEnsanchada: false, huecosVacios: 0, aprovechados: [],
}

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
  /** Lo puso la auto-semana: volver a pulsarla lo sustituye. Lo demás se queda. */
  auto?: boolean
  /** Id de la guarnición encendida; sin ella, se come el plato pelado. */
  guarnicionId?: string
  momento?: Momento
}

type Plan = Record<Dia, EntradaPlan[]>

const PLAN_VACIO: Plan = Object.fromEntries(DIAS.map((d) => [d, []])) as unknown as Plan

function guarnicionRecordada(receta: RecetaListada, guarnicionId?: string, conGuarnicion?: boolean) {
  const opciones = guarnicionesDe(receta)
  if (opciones.some((g) => g.id === guarnicionId)) return { guarnicionId }
  if (guarnicionId) return null
  const recomendada = opciones[0]
  return conGuarnicion && recomendada ? { guarnicionId: recomendada.id } : null
}

/**
 * La que enciende la auto-semana: la recomendada, salvo que los límites de la
 * semana la descarten. Con el filtro sin gluten puesto, encender el pan de pita
 * de un plato limpio era meter gluten en la compra sin decirlo.
 */
function guarnicionAuto(receta: RecetaListada, limites: LimitesSemana) {
  return guarnicionPara(receta, limites.dieta ?? undefined, limites.sinGluten)
}

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
        ...(e.auto ? { auto: true } : {}),
        ...(e.guarnicionId ? { guarnicionId: e.guarnicionId } : {}),
      })
    }
  }
  return out
}

function hidratar(dtos: EntradaPlanDTO[], recetas: RecetaListada[]): Plan {
  const byId = new Map(recetas.map((r) => [r.id, r]))
  const result = Object.fromEntries(DIAS.map((d) => [d, []])) as unknown as Plan
  for (const { dia, recetaId, raciones, cocinada, auto, guarnicionId, conGuarnicion, momento } of dtos) {
    const receta = byId.get(recetaId)
    if (!receta || !DIAS.includes(dia as Dia)) continue
    result[dia as Dia].push({
      id: `${dia}-${recetaId}-${Date.now()}-${Math.random()}`,
      receta,
      raciones,
      momento: esMomento(momento) ? momento : momentoPorDefecto(receta.tipo),
      ...(cocinada ? { cocinada: true } : {}),
      ...(auto ? { auto: true } : {}),
      // Un id que ya no está en el catálogo de la receta se descarta: la
      // guarnición pudo borrarse entre que se guardó el plan y se abre. Y un
      // plan viejo, que solo decía sí o no, se lee como la recomendada.
      ...(guarnicionRecordada(receta, guarnicionId, conGuarnicion) ?? {}),
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
  setGuarnicionPlan: (dia: Dia, entradaId: string, guarnicionId?: string) => void
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

  const descartadosRef = useRef<Set<string>>(new Set())
  const yaPropuestosRef = useRef<Set<string>>(new Set())

  const seleccionadasRef = useRef(seleccionadas)
  const estaSeleccionadaRef = useRef(estaSeleccionada)
  useEffect(() => { seleccionadasRef.current = seleccionadas }, [seleccionadas])
  useEffect(() => { estaSeleccionadaRef.current = estaSeleccionada }, [estaSeleccionada])

  const planIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const totales = new Map<string, { receta: RecetaListada; raciones: number; guarnicionId?: string }>()
    for (const dia of DIAS) {
      for (const { receta, raciones, cocinada, guarnicionId } of plan[dia]) {
        if (cocinada) continue
        const prev = totales.get(receta.id)
        totales.set(receta.id, {
          receta,
          raciones: (prev?.raciones ?? 0) + raciones,
          // La misma receta dos días con guarniciones distintas: manda la
          // primera que la lleve, que es la que hay que comprar sí o sí.
          guarnicionId: prev?.guarnicionId ?? guarnicionId,
        })
      }
    }

    for (const [, { receta, raciones, guarnicionId }] of totales) {
      if (!estaSeleccionadaRef.current(receta.id)) {
        toggleReceta(receta)
      }
      setRacionesLista(receta.id, raciones)
      setGuarnicionLista(receta.id, guarnicionId)
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
    descartadosRef.current.delete(receta.id)
    cambiarPlan((prev) => ({
      ...prev,
      [dia]: [
        ...prev[dia],
        { id: `${dia}-${receta.id}-${Date.now()}`, receta, raciones, momento },
      ].sort(porMomento),
    }))
  }, [cambiarPlan])

  const quitar = useCallback((dia: Dia, entradaId: string) => {
    const entrada = plan[dia].find((e) => e.id === entradaId)
    if (entrada && !entrada.cocinada) descartadosRef.current.add(entrada.receta.id)
    cambiarPlan((prev) => ({
      ...prev,
      [dia]: prev[dia].filter((e) => e.id !== entradaId),
    }))
  }, [cambiarPlan, plan])

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
        .map((e) => (e.id === entradaId ? { ...e, momento, auto: undefined } : e))
        .sort(porMomento),
    }))
  }, [cambiarPlan])

  const setGuarnicionPlan = useCallback((dia: Dia, entradaId: string, guarnicionId?: string) => {
    cambiarPlan((prev) => ({
      ...prev,
      [dia]: prev[dia].map((e) => (e.id === entradaId ? { ...e, guarnicionId } : e)),
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
        [hastaDia]: [...prev[hastaDia], { ...entrada, auto: undefined }].sort(porMomento),
      }
    })
  }, [cambiarPlan])

  const limpiar = useCallback(() => {
    huerfanasRef.current = []
    descartadosRef.current.clear()
    cambiarPlan(PLAN_VACIO)
  }, [cambiarPlan])

  const autollenar = useCallback((
    recetas: RecetaListada[],
    raciones: number,
    despensa: ItemAprovechable[] = []
  ): InformeSemana => {
    if (recetas.length === 0) return INFORME_VACIO
    const prefs = preferenciasRef.current
    const { limites } = prefs

    // Solo se rehace lo que puso la pasada anterior. Lo cocinado y lo puesto a
    // mano se queda: para vaciar la semana está su propio botón.
    const nuevo = Object.fromEntries(
      DIAS.map((d) => [d, plan[d].filter((e) => e.cocinada || !e.auto)])
    ) as unknown as Plan
    const conservadas = DIAS.flatMap((d) => nuevo[d])
    const hechas = conservadas.filter((e) => e.cocinada).map((e) => e.receta)
    const fijados = conservadas.filter((e) => !e.cocinada).map((e) => e.receta)

    // Lo comprado y aún sin día entra por delante: sus ingredientes ya están en casa.
    const compradas = new Map(pendientes.map((p) => [p.receta.id, p]))
    let compradasPuestas = 0

    const ocupado = (dia: Dia, momento: Momento) => nuevo[dia].some((e) => momentoDe(e) === momento)
    const repartirLos = (momento: Momento, cuantos: number) => {
      const puestos = DIAS.filter((d) => ocupado(d, momento))
      const faltan = Math.max(0, Math.min(cuantos, DIAS.length) - puestos.length)
      return repartidos(DIAS.filter((d) => !puestos.includes(d)), faltan)
    }

    const diasConCena = repartirLos('cena', prefs.cenas)
    const diasConComida = repartirLos('comida', prefs.comidas)
    const diasConDesayuno = repartirLos('desayuno', prefs.desayunos)

    const principales = recetas.filter(esPrincipal)
    const desayunos = recetas.filter(esDesayuno)

    const deNoche = principales.filter(cabeDeNoche)

    const topeDe = (dia: Dia) => (FINDE.includes(dia) ? limites.tiempoMaxFinde : limites.tiempoMax)
    const construir = (dias: Dia[], momento: Momento, pool: RecetaListada[], sinTope: Set<Dia>): Hueco[] =>
      dias.map((dia) => ({
        id: `${dia}:${momento}`,
        dia,
        candidatos: candidatas(pool, limites, sinTope.has(dia) ? null : topeDe(dia)),
      }))

    const llenan = (grupo: Hueco[]) => huecosConPlatoPropio(grupo) >= grupo.length

    const NINGUNO = new Set<Dia>()
    const TODOS = new Set<Dia>(DIAS)

    // El tope se quita día a día, empezando por el que menos tiene donde elegir,
    // y solo hasta que haya platos distintos para todos los huecos.
    const ensanchar = (montar: (sinTope: Set<Dia>) => Hueco[]): Hueco[] => {
      const estrictos = montar(NINGUNO)
      if (llenan(estrictos)) return estrictos
      const conTope = estrictos.filter((h) => topeDe(h.dia as Dia) != null)
      // Un día sin nada dentro del tope se abre siempre: antes pasarse de tiempo
      // que dejarlo vacío.
      const forzados = new Set(conTope.filter((h) => h.candidatos.length === 0).map((h) => h.dia as Dia))
      const orden = [...new Set(conTope
        .filter((h) => !forzados.has(h.dia as Dia))
        .sort((a, b) =>
          a.candidatos.length - b.candidatos.length ||
          Number(FINDE.includes(b.dia as Dia)) - Number(FINDE.includes(a.dia as Dia)))
        .map((h) => h.dia as Dia))]
      const abiertos = new Set(forzados)
      let huecos = montar(abiertos)
      for (const dia of orden) {
        if (llenan(huecos)) break
        abiertos.add(dia)
        huecos = montar(abiertos)
      }
      // Si ni así salen platos para todos, se repite dentro del tiempo pedido:
      // unas sobras antes que una receta de hora y media un martes.
      return llenan(huecos) ? huecos : montar(forzados)
    }

    const construirPrincipales = (sinTope: Set<Dia>, cenasLigeras: boolean) => [
      ...construir(diasConComida, 'comida', principales, sinTope),
      ...construir(diasConCena, 'cena', cenasLigeras ? deNoche : principales, sinTope),
    ]

    const soloCenas = (grupo: Hueco[]) => grupo.filter((h) => h.id.endsWith(':cena'))
    const cenasLigeras =
      llenan(soloCenas(construirPrincipales(NINGUNO, true))) ||
      llenan(soloCenas(construirPrincipales(TODOS, true)))
    const cenaEnsanchada = !cenasLigeras

    const huecosPrincipales = ensanchar((sinTope) => construirPrincipales(sinTope, cenasLigeras))
    const huecosDesayuno = ensanchar((sinTope) => construir(diasConDesayuno, 'desayuno', desayunos, sinTope))

    const huecos = [...huecosPrincipales, ...huecosDesayuno]
    if (huecos.length === 0) {
      huerfanasRef.current = huerfanasRef.current.filter((d) => d.cocinada || !d.auto)
      cambiarPlan(nuevo)
      return { ...INFORME_VACIO, conservados: conservadas.length }
    }

    // Lo que se queda cuenta en el día donde está: si el lunes trae 50 g puestos,
    // al lunes le quedan 75 y no los 125 enteros.
    const proteinaPorDia = new Map<string, number>()
    for (const dia of DIAS) {
      const puesta = nuevo[dia].reduce((t, e) => t + aporteDe(e.receta, e.guarnicionId ?? null).proteinas, 0)
      if (puesta > 0) proteinaPorDia.set(dia, puesta)
    }

    const { porHueco, repetidos, aprovechados } = repartirSemana(huecos, {
      preferencias: prefs,
      yaEnLaSemana: hechas,
      fijados,
      preferidos: compradas.keys(),
      despensa,
      descartados: descartadosRef.current,
      yaPropuestos: yaPropuestosRef.current,
      proteinaPorDia,
    })

    // Solo se recuerda la última pasada: así alterna entre dos semanas buenas en
    // vez de ir bajando de calidad a cada pulsación.
    yaPropuestosRef.current = new Set([...porHueco.values()].map((r) => r.id))

    for (const hueco of huecos) {
      const receta = porHueco.get(hueco.id)
      if (!receta) continue
      const [dia, momento] = hueco.id.split(':') as [Dia, Momento]
      // Una comprada que entra se queda como puesta a mano: si la siguiente
      // pasada la sustituyera, ya no estaría ni en el plan ni en las pendientes.
      const comprada = compradas.get(receta.id)
      if (comprada) {
        compradas.delete(receta.id)
        compradasPuestas++
      }
      nuevo[dia] = [...nuevo[dia], {
        id: `${hueco.id}-${receta.id}-${Date.now()}-${Math.random()}`,
        receta,
        raciones: comprada?.raciones ?? raciones,
        momento,
        ...(comprada ? {} : { auto: true }),
        ...(guarnicionAuto(receta, limites) ? { guarnicionId: guarnicionAuto(receta, limites)!.id } : {}),
      }]
    }

    for (const dia of DIAS) nuevo[dia] = [...nuevo[dia]].sort(porMomento)

    huerfanasRef.current = huerfanasRef.current.filter((d) => d.cocinada || !d.auto)
    cambiarPlan(nuevo)

    const llenos = (grupo: Hueco[]) => grupo.filter((h) => porHueco.has(h.id)).length
    const tiempoEnsanchado = [...porHueco].some(([id, receta]) => {
      const tope = topeDe(id.split(':')[0] as Dia)
      return tope != null && receta.tiempoPreparacion > tope
    })

    return {
      comidas: llenos(huecosPrincipales.filter((h) => h.id.endsWith(':comida'))),
      cenas: llenos(huecosPrincipales.filter((h) => h.id.endsWith(':cena'))),
      desayunos: llenos(huecosDesayuno),
      conservados: conservadas.length,
      compradas: compradasPuestas,
      repetidos: repetidos.size,
      tiempoEnsanchado,
      cenaEnsanchada,
      huecosVacios: huecos.filter((h) => !porHueco.has(h.id)).length,
      aprovechados,
    }
  }, [cambiarPlan, plan, pendientes])

  // Deshacer un quitado devuelve el plato al plan, así que deja de estar
  // descartado: lo que vuelve a estar puesto no puede pesar en su contra.
  const restaurarPlan = useCallback((anterior: Plan) => {
    for (const dia of DIAS) {
      for (const e of anterior[dia]) descartadosRef.current.delete(e.receta.id)
    }
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
