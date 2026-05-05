import { createContext, useContext, type ReactNode } from 'react'
import useListaCompra, { type IngredienteAgrupado, type EntradaLista } from '../hooks/useListaCompra'
import type { Receta } from '../types/receta'

interface ListaCompraContextValue {
  seleccionadas: EntradaLista[]
  listaCompra: IngredienteAgrupado[]
  toggleReceta: (receta: Receta) => void
  setRaciones: (id: string, raciones: number) => void
  estaSeleccionada: (id: string) => boolean
  vaciar: () => void
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
