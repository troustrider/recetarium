import { useState, useMemo } from 'react'
import type { Receta, Ingrediente } from '../types/receta'

export interface IngredienteAgrupado extends Ingrediente {
  recetas: string[]
}

function useListaCompra() {
  const [seleccionadas, setSeleccionadas] = useState<Receta[]>([])

  function toggleReceta(receta: Receta) {
    setSeleccionadas((prev) =>
      prev.some((r) => r.id === receta.id)
        ? prev.filter((r) => r.id !== receta.id)
        : [...prev, receta]
    )
  }

  function estaSeleccionada(id: string) {
    return seleccionadas.some((r) => r.id === id)
  }

  function vaciar() {
    setSeleccionadas([])
  }

  const listaCompra = useMemo<IngredienteAgrupado[]>(() => {
    const mapa = new Map<string, IngredienteAgrupado>()

    for (const receta of seleccionadas) {
      for (const ing of receta.ingredientes) {
        const clave = `${ing.nombre}__${ing.unidad}`
        const existente = mapa.get(clave)
        if (existente) {
          existente.cantidad += ing.cantidad
          existente.recetas.push(receta.nombre)
        } else {
          mapa.set(clave, { ...ing, recetas: [receta.nombre] })
        }
      }
    }

    return Array.from(mapa.values()).sort((a, b) =>
      a.familia.localeCompare(b.familia) || a.nombre.localeCompare(b.nombre)
    )
  }, [seleccionadas])

  return { seleccionadas, listaCompra, toggleReceta, estaSeleccionada, vaciar }
}

export default useListaCompra
