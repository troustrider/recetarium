import { useState, useMemo, useEffect, useRef } from 'react'
import type { Receta, Ingrediente } from '../types/receta'
import { getExtras, saveExtras } from '../api/estado'
import { claveIngrediente, canonUnidad } from '../utils/ingredientes'

export interface IngredienteAgrupado extends Ingrediente {
  recetas: string[]
  esExtra?: boolean
  clave: string
}

export interface EntradaLista {
  receta: Receta
  raciones: number
}

function useListaCompra() {
  const [seleccionadas, setSeleccionadas] = useState<EntradaLista[]>([])
  const [extras, setExtras] = useState<Ingrediente[]>([])

  // Ítems manuales: compartidos en backend (los ve también la pareja).
  const hidratadoRef = useRef(false)
  const saltarGuardadoRef = useRef(false)
  useEffect(() => {
    let cancelado = false
    getExtras()
      .then((e) => { if (!cancelado) { saltarGuardadoRef.current = true; setExtras(e) } })
      .catch(() => {})
      .finally(() => { if (!cancelado) hidratadoRef.current = true })
    return () => { cancelado = true }
  }, [])
  useEffect(() => {
    if (!hidratadoRef.current) return
    if (saltarGuardadoRef.current) { saltarGuardadoRef.current = false; return }
    const t = setTimeout(() => { saveExtras(extras).catch(() => {}) }, 800)
    return () => clearTimeout(t)
  }, [extras])

  function toggleReceta(receta: Receta) {
    setSeleccionadas((prev) =>
      prev.some((e) => e.receta.id === receta.id)
        ? prev.filter((e) => e.receta.id !== receta.id)
        : [...prev, { receta, raciones: 1 }]
    )
  }

  function setRaciones(id: string, raciones: number) {
    const clamped = Math.max(1, raciones)
    setSeleccionadas((prev) =>
      prev.map((e) => (e.receta.id === id ? { ...e, raciones: clamped } : e))
    )
  }

  function estaSeleccionada(id: string) {
    return seleccionadas.some((e) => e.receta.id === id)
  }

  function vaciar() {
    setSeleccionadas([])
    setExtras([])
  }

  // Carga N recetas al azar (que no estén ya), todas con las mismas raciones.
  function cargarAleatorias(recetas: Receta[], n: number, raciones: number) {
    const yaIds = new Set(seleccionadas.map((e) => e.receta.id))
    const candidatas = recetas.filter((r) => !yaIds.has(r.id))
    const barajadas = [...candidatas].sort(() => Math.random() - 0.5).slice(0, n)
    if (barajadas.length === 0) return
    setSeleccionadas((prev) => [...prev, ...barajadas.map((receta) => ({ receta, raciones }))])
  }

  function addExtra(item: Ingrediente) {
    const clave = claveIngrediente(item.nombre, item.unidad)
    setExtras((prev) =>
      prev.some((e) => claveIngrediente(e.nombre, e.unidad) === clave) ? prev : [...prev, item]
    )
  }

  function removeExtra(clave: string) {
    setExtras((prev) => prev.filter((e) => claveIngrediente(e.nombre, e.unidad) !== clave))
  }

  // Coste estimado de la compra: precio/porción × porciones × raciones.
  const coste = useMemo(
    () =>
      seleccionadas.reduce(
        (acc, { receta, raciones }) =>
          acc + (receta.precioPorPorcion ?? 0) * (receta.porciones ?? 1) * raciones,
        0
      ),
    [seleccionadas]
  )

  const listaCompra = useMemo<IngredienteAgrupado[]>(() => {
    const mapa = new Map<string, IngredienteAgrupado>()

    for (const { receta, raciones } of seleccionadas) {
      for (const ing of receta.ingredientes) {
        const clave = claveIngrediente(ing.nombre, ing.unidad)
        const existente = mapa.get(clave)
        if (existente) {
          existente.cantidad += ing.cantidad * raciones
          if (!existente.recetas.includes(receta.nombre)) {
            existente.recetas.push(receta.nombre)
          }
        } else {
          mapa.set(clave, { ...ing, unidad: canonUnidad(ing.nombre, ing.unidad), cantidad: ing.cantidad * raciones, recetas: [receta.nombre], clave })
        }
      }
    }

    for (const ex of extras) {
      const clave = claveIngrediente(ex.nombre, ex.unidad)
      mapa.set(clave, { ...ex, unidad: canonUnidad(ex.nombre, ex.unidad), recetas: [], esExtra: true, clave })
    }

    return Array.from(mapa.values()).sort((a, b) =>
      a.familia.localeCompare(b.familia) || a.nombre.localeCompare(b.nombre)
    )
  }, [seleccionadas, extras])

  return {
    seleccionadas, listaCompra, extras, coste,
    toggleReceta, setRaciones, estaSeleccionada, vaciar,
    cargarAleatorias, addExtra, removeExtra,
  }
}

export default useListaCompra
