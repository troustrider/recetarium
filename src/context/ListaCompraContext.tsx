import { createContext, useContext, type ReactNode } from 'react'
import useListaCompra, { type IngredienteAgrupado, type EntradaLista } from '../hooks/useListaCompra'
import type { Receta, Ingrediente } from '../types/receta'

interface ListaCompraContextValue {
  seleccionadas: EntradaLista[]
  listaCompra: IngredienteAgrupado[]
  enDespensa: IngredienteAgrupado[]
  extras: Ingrediente[]
  coste: number
  toggleReceta: (receta: Receta) => void
  setRaciones: (id: string, raciones: number) => void
  estaSeleccionada: (id: string) => boolean
  vaciar: () => void
  cargarAleatorias: (recetas: Receta[], n: number, raciones: number) => void
  addExtra: (item: Ingrediente) => void
  removeExtra: (clave: string) => void
  descartar: (clave: string) => void
}

const ListaCompraContext = createContext<ListaCompraContextValue | null>(null)

export function ListaCompraProvider({ children }: { children: ReactNode }) {
  const value = useListaCompra()
  return <ListaCompraContext.Provider value={value}>{children}</ListaCompraContext.Provider>
}

export function useListaCompraContext() {
  const ctx = useContext(ListaCompraContext)
  if (!ctx) throw new Error('useListaCompraContext debe usarse dentro de ListaCompraProvider')
  return ctx
}
