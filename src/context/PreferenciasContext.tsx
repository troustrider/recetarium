import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import {
  LIMITES_VACIOS,
  MAX_COCINAS,
  MAX_PRIORIDADES,
  PREFERENCIAS_POR_DEFECTO,
  type LimitesSemana,
  type Preferencias,
  type Prioridad,
} from '../types/preferencias'
import { getPreferencias, savePreferencias } from '../api/estado'
import { useEstadoCompartido } from '../hooks/useEstadoCompartido'

interface PreferenciasCtx {
  preferencias: Preferencias
  alternarPrioridad: (prioridad: Prioridad) => void
  alternarCocina: (cocina: string) => void
  setDesayunos: (n: number) => void
  setLimites: (limites: Partial<LimitesSemana>) => void
  aplicar: (preferencias: Preferencias) => void
  reiniciar: () => void
}

const PreferenciasContext = createContext<PreferenciasCtx | null>(null)

/**
 * Lo que llega del servidor puede ser {} —hogar que nunca las ha tocado— o unas
 * preferencias guardadas con una versión anterior a la que le falte un campo. En
 * los dos casos se completan con las de por defecto en vez de romper la pantalla.
 */
function completar(guardadas: Partial<Preferencias> | null | undefined): Preferencias {
  return {
    ...PREFERENCIAS_POR_DEFECTO,
    ...guardadas,
    limites: { ...LIMITES_VACIOS, ...guardadas?.limites },
  }
}

export function PreferenciasProvider({ children }: { children: ReactNode }) {
  const [preferencias, cambiar] = useEstadoCompartido<Preferencias, Partial<Preferencias>>({
    nombre: 'las preferencias de la semana',
    inicial: PREFERENCIAS_POR_DEFECTO,
    cargar: getPreferencias,
    guardar: (dto) => savePreferencias(completar(dto)),
    serializar: (p) => p,
    hidratar: completar,
  })

  // Al llegar a la cuarta prioridad sale la más antigua. Es lo que hace que el
  // tope se explique solo: nunca hay que quitar una para poder poner otra.
  const alternarPrioridad = useCallback((prioridad: Prioridad) => {
    cambiar((prev) => {
      const dentro = prev.prioridades.includes(prioridad)
      const prioridades = dentro
        ? prev.prioridades.filter((p) => p !== prioridad)
        : [...prev.prioridades, prioridad].slice(-MAX_PRIORIDADES)
      return { ...prev, prioridades }
    })
  }, [cambiar])

  const alternarCocina = useCallback((cocina: string) => {
    cambiar((prev) => {
      const dentro = prev.cocinasFavoritas.includes(cocina)
      const cocinasFavoritas = dentro
        ? prev.cocinasFavoritas.filter((c) => c !== cocina)
        : [...prev.cocinasFavoritas, cocina].slice(-MAX_COCINAS)
      return { ...prev, cocinasFavoritas }
    })
  }, [cambiar])

  const setDesayunos = useCallback((n: number) => {
    cambiar((prev) => ({ ...prev, desayunos: Math.max(0, Math.min(7, Math.round(n))) }))
  }, [cambiar])

  const setLimites = useCallback((limites: Partial<LimitesSemana>) => {
    cambiar((prev) => ({ ...prev, limites: { ...prev.limites, ...limites } }))
  }, [cambiar])

  const aplicar = useCallback((siguiente: Preferencias) => cambiar(completar(siguiente)), [cambiar])
  const reiniciar = useCallback(() => cambiar(PREFERENCIAS_POR_DEFECTO), [cambiar])

  const valor = useMemo(
    () => ({ preferencias, alternarPrioridad, alternarCocina, setDesayunos, setLimites, aplicar, reiniciar }),
    [preferencias, alternarPrioridad, alternarCocina, setDesayunos, setLimites, aplicar, reiniciar]
  )

  return <PreferenciasContext.Provider value={valor}>{children}</PreferenciasContext.Provider>
}

export function usePreferencias() {
  const ctx = useContext(PreferenciasContext)
  if (!ctx) throw new Error('usePreferencias fuera de PreferenciasProvider')
  return ctx
}
