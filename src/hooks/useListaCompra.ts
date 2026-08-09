import { useState, useMemo, useCallback } from 'react'
import type { Receta, Ingrediente } from '../types/receta'
import { getExtras, saveExtras } from '../api/estado'
import { useEstadoCompartido } from './useEstadoCompartido'
import { claveIngrediente, canonUnidad, cantidadDeCompra, ingredientesDe } from '../utils/ingredientes'
import { repartirDespensa } from '../utils/despensa'
import { seDesglosa, repartirPorReceta, type ParteReceta } from '../utils/desglose'
import { costeCompra as calcularCosteCompra, type CosteCompra } from '../utils/precios'
import { useDespensa } from '../context/DespensaContext'

export interface IngredienteAgrupado extends Ingrediente {
  recetas: string[]
  esExtra?: boolean
  clave: string
  quedaPoco?: boolean
  // Parte que ya cubre la despensa: `cantidad` es solo lo que falta comprar.
  yaTengo?: number
  // Cuánto de lo que se compra va a cada plato, para congelar por raciones.
  // Solo en lo que se congela en piezas y va a más de un plato.
  desglose?: ParteReceta[]
}

export interface EntradaLista {
  receta: Receta
  raciones: number
  /** Comprar también lo de la guarnición. Lo marca el planificador o la propia lista. */
  conGuarnicion?: boolean
}

export interface InstantaneaLista {
  seleccionadas: EntradaLista[]
  extras: Ingrediente[]
  descartados: Set<string>
}

// Cuánta gente come con la receta tal cual está escrita. `raciones` cuenta
// personas, no veces que se cocina: pedir 2 raciones de un plato escrito para 2
// es hacerlo una vez, no dos. Antes multiplicaba la receta entera por raciones
// y la lista salía al doble.
export function racionesBase(receta: Pick<Receta, 'porciones'>): number {
  return receta.porciones && receta.porciones > 0 ? receta.porciones : 2
}

function useListaCompra() {
  const [seleccionadas, setSeleccionadas] = useState<EntradaLista[]>([])
  // Claves quitadas a mano de la lista (ítems de receta que no se quieren comprar).
  const [descartados, setDescartados] = useState<Set<string>>(new Set())

  // Ítems manuales: compartidos en backend (los ve también la pareja).
  const [extras, setExtras] = useEstadoCompartido<Ingrediente[], Ingrediente[]>({
    nombre: 'la lista de la compra',
    inicial: [],
    cargar: getExtras,
    guardar: saveExtras,
    serializar: (e) => e,
    hidratar: (e) => e,
  })

  const { despensa } = useDespensa()

  // Callbacks estables: RecetaCard está memoizada y los recibe como props.
  const toggleReceta = useCallback((receta: Receta) => {
    setSeleccionadas((prev) =>
      prev.some((e) => e.receta.id === receta.id)
        ? prev.filter((e) => e.receta.id !== receta.id)
        : [...prev, { receta, raciones: racionesBase(receta) }]
    )
  }, [])

  const setRaciones = useCallback((id: string, raciones: number) => {
    const clamped = Math.max(1, raciones)
    setSeleccionadas((prev) =>
      prev.map((e) => (e.receta.id === id ? { ...e, raciones: clamped } : e))
    )
  }, [])

  const setGuarnicion = useCallback((id: string, conGuarnicion: boolean) => {
    setSeleccionadas((prev) =>
      prev.map((e) => (e.receta.id === id ? { ...e, conGuarnicion } : e))
    )
  }, [])

  const estaSeleccionada = useCallback(
    (id: string) => seleccionadas.some((e) => e.receta.id === id),
    [seleccionadas]
  )

  const vaciar = useCallback(() => {
    setSeleccionadas([])
    setExtras([])
    setDescartados(new Set())
  }, [setExtras])

  // Carga N recetas al azar (que no estén ya), todas con las mismas raciones.
  const cargarAleatorias = useCallback((recetas: Receta[], n: number, raciones: number) => {
    setSeleccionadas((prev) => {
      const yaIds = new Set(prev.map((e) => e.receta.id))
      const candidatas = recetas.filter((r) => !yaIds.has(r.id))
      const barajadas = [...candidatas].sort(() => Math.random() - 0.5).slice(0, n)
      return barajadas.length === 0 ? prev : [...prev, ...barajadas.map((receta) => ({ receta, raciones }))]
    })
  }, [])

  const addExtra = useCallback((item: Ingrediente) => {
    const clave = claveIngrediente(item.nombre, item.unidad)
    setExtras((prev) =>
      prev.some((e) => claveIngrediente(e.nombre, e.unidad) === clave) ? prev : [...prev, item]
    )
  }, [setExtras])

  const removeExtra = useCallback((clave: string) => {
    setExtras((prev) => prev.filter((e) => claveIngrediente(e.nombre, e.unidad) !== clave))
  }, [setExtras])

  const descartar = useCallback((clave: string) => {
    setDescartados((prev) => new Set(prev).add(clave))
  }, [])

  // La lista son tres trozos de estado, así que el deshacer los devuelve juntos.
  const instantanea = useCallback(
    (): InstantaneaLista => ({ seleccionadas, extras, descartados }),
    [seleccionadas, extras, descartados]
  )

  const restaurarLista = useCallback((anterior: InstantaneaLista) => {
    setSeleccionadas(anterior.seleccionadas)
    setExtras(anterior.extras)
    setDescartados(anterior.descartados)
  }, [setExtras])

  // Coste de los platos: precio por ración × raciones.
  const coste = useMemo(
    () =>
      seleccionadas.reduce(
        (acc, { receta, raciones }) => acc + (receta.precioPorPorcion ?? 0) * raciones,
        0
      ),
    [seleccionadas]
  )

  // Lo que hay que comprar de verdad: lo cubierto por la despensa se aparta a
  // `enDespensa` (recuperable con un toque, por si el matching se equivoca), lo
  // que hay a medias entra rebajado por lo que ya tenemos y lo que queda poco
  // entra entero pero marcado. Los extras manuales nunca se filtran: si se
  // añadieron a mano, se quieren comprar.
  const { listaCompra, enDespensa } = useMemo(() => {
    const mapa = new Map<string, IngredienteAgrupado>()

    for (const { receta, raciones, conGuarnicion } of seleccionadas) {
      for (const ing of ingredientesDe(receta, conGuarnicion)) {
        const clave = claveIngrediente(ing.nombre, ing.unidad)
        const existente = mapa.get(clave)
        const cantidad = ing.cantidad * (raciones / racionesBase(receta))
        if (existente) {
          existente.cantidad += cantidad
          if (!existente.recetas.includes(receta.nombre)) {
            existente.recetas.push(receta.nombre)
          }
          const parte = existente.desglose!.find((d) => d.receta === receta.nombre)
          if (parte) parte.cantidad += cantidad
          else existente.desglose!.push({ receta: receta.nombre, cantidad })
        } else {
          mapa.set(clave, {
            ...ing,
            unidad: canonUnidad(ing.nombre, ing.unidad),
            cantidad,
            recetas: [receta.nombre],
            desglose: [{ receta: receta.nombre, cantidad }],
            clave,
          })
        }
      }
    }

    for (const ex of extras) {
      const clave = claveIngrediente(ex.nombre, ex.unidad)
      mapa.set(clave, { ...ex, unidad: canonUnidad(ex.nombre, ex.unidad), recetas: [], esExtra: true, clave })
    }

    const comprar: IngredienteAgrupado[] = []
    const yaHay: IngredienteAgrupado[] = []
    const deReceta = [...mapa.values()].filter((i) => !i.esExtra && !descartados.has(i.clave))
    const reparto = repartirDespensa(deReceta, despensa)

    comprar.push(...[...mapa.values()].filter((i) => i.esExtra))
    // Un ingrediente que va a un solo plato ya se lee entero en su cantidad.
    const conDesglose = (item: IngredienteAgrupado, yaCubierto: number): IngredienteAgrupado => {
      if (!seDesglosa(item.familia) || (item.desglose?.length ?? 0) < 2) {
        return { ...item, desglose: undefined }
      }
      return { ...item, desglose: repartirPorReceta(item.desglose!, yaCubierto) }
    }

    // Lo que se lleva a la tienda va en piezas enteras; el desglose por plato
    // se queda con el reparto real, que es lo que luego se congela.
    const enPiezas = (item: IngredienteAgrupado): IngredienteAgrupado => ({
      ...item,
      cantidad: cantidadDeCompra(item.cantidad, item.unidad),
    })

    deReceta.forEach((item, k) => {
      const { cobertura, aComprar, yaTengo } = reparto[k]
      if (cobertura === 'cubierto') yaHay.push({ ...item, desglose: undefined })
      else if (cobertura === 'poco') comprar.push({ ...enPiezas(conDesglose(item, 0)), quedaPoco: true })
      else if (cobertura === 'parcial') comprar.push({ ...enPiezas({ ...conDesglose(item, yaTengo), cantidad: aComprar }), yaTengo })
      else comprar.push(enPiezas(conDesglose(item, 0)))
    })

    const porFamilia = (a: IngredienteAgrupado, b: IngredienteAgrupado) =>
      a.familia.localeCompare(b.familia) || a.nombre.localeCompare(b.nombre)
    return { listaCompra: comprar.sort(porFamilia), enDespensa: yaHay.sort(porFamilia) }
  }, [seleccionadas, extras, despensa, descartados])

  // Lo que se paga en caja: sale de la lista final, que ya excluye lo que hay
  // en la despensa, lo que quitaste a mano, y ya incluye los items manuales.
  const compra: CosteCompra = useMemo(() => calcularCosteCompra(listaCompra), [listaCompra])

  // Memoizado: es el value del provider, y sin esto cualquier render de un
  // padre repinta el catálogo entero.
  return useMemo(
    () => ({
      seleccionadas, listaCompra, enDespensa, extras, coste, compra,
      toggleReceta, setRaciones, setGuarnicion, estaSeleccionada, vaciar,
      cargarAleatorias, addExtra, removeExtra, descartar,
      instantanea, restaurarLista,
    }),
    [
      seleccionadas, listaCompra, enDespensa, extras, coste, compra,
      toggleReceta, setRaciones, setGuarnicion, estaSeleccionada, vaciar,
      cargarAleatorias, addExtra, removeExtra, descartar,
      instantanea, restaurarLista,
    ]
  )
}

export default useListaCompra
