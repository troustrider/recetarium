import { useState, useMemo } from 'react'
import type { Receta, Ingrediente } from '../types/receta'

export interface IngredienteAgrupado extends Ingrediente {
  recetas: string[]
}

export interface EntradaLista {
  receta: Receta
  raciones: number
}

const MAX_RACIONES = 4

function useListaCompra() {
  const [seleccionadas, setSeleccionadas] = useState<EntradaLista[]>([])

  function toggleReceta(receta: Receta) {
    setSeleccionadas((prev) =>
      prev.some((e) => e.receta.id === receta.id)
        ? prev.filter((e) => e.receta.id !== receta.id)
        : [...prev, { receta, raciones: 1 }]
    )
  }

  function setRaciones(id: string, raciones: number) {
    const clamped = Math.max(1, Math.min(MAX_RACIONES, raciones))
    setSeleccionadas((prev) =>
      prev.map((e) => (e.receta.id === id ? { ...e, raciones: clamped } : e))
    )
  }

  function estaSeleccionada(id: string) {
    return seleccionadas.some((e) => e.receta.id === id)
  }

  function vaciar() {
    setSeleccionadas([])
  }

  const listaCompra = useMemo<IngredienteAgrupado[]>(() => {
    const mapa = new Map<string, IngredienteAgrupado>()

    for (const { receta, raciones } of seleccionadas) {
      for (const ing of receta.ingredientes) {
        const clave = `${ing.nombre}__${ing.unidad}`
        const existente = mapa.get(clave)
        if (existente) {
          existente.cantidad += ing.cantidad * raciones
          if (!existente.recetas.includes(receta.nombre)) {
            existente.recetas.push(receta.nombre)
          }
        } else {
          mapa.set(clave, { ...ing, cantidad: ing.cantidad * raciones, recetas: [receta.nombre] })
        }
      }
    }

    return Array.from(mapa.values()).sort((a, b) =>
      a.familia.localeCompare(b.familia) || a.nombre.localeCompare(b.nombre)
    )
  }, [seleccionadas])

  return { seleccionadas, listaCompra, toggleReceta, setRaciones, estaSeleccionada, vaciar }
}

export default useListaCompra
