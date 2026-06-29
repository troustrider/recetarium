import { useState, useEffect } from 'react'

const STORAGE_KEY = 'recetarium:comprados'

// Ítems ya echados al carro. Efímero por viaje al súper, por dispositivo.
export function useComprados() {
  const [comprados, setComprados] = useState<Set<string>>(() => {
    try {
      return new Set<string>(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'))
    } catch {
      return new Set<string>()
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...comprados]))
  }, [comprados])

  function toggle(clave: string) {
    setComprados((prev) => {
      const next = new Set(prev)
      if (next.has(clave)) next.delete(clave)
      else next.add(clave)
      return next
    })
  }

  function limpiar() {
    setComprados(new Set())
  }

  return { comprados, toggle, limpiar }
}

export default useComprados
