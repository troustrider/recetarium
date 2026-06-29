import { createContext, useContext, type ReactNode } from 'react'
import useComprados from '../hooks/useComprados'

interface CompradosCtx {
  comprados: Set<string>
  toggle: (clave: string) => void
  limpiar: () => void
}

const CompradosContext = createContext<CompradosCtx | null>(null)

export function CompradosProvider({ children }: { children: ReactNode }) {
  const value = useComprados()
  return <CompradosContext.Provider value={value}>{children}</CompradosContext.Provider>
}

export function useCompradosContext() {
  const ctx = useContext(CompradosContext)
  if (!ctx) throw new Error('useCompradosContext fuera de CompradosProvider')
  return ctx
}
