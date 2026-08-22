import { useEffect } from 'react'

/**
 * El título de la pestaña. Sin esto el historial del navegador es una lista de
 * entradas llamadas todas «Recetarium», que es como no tener historial.
 */
export default function useTitulo(titulo?: string | null): void {
  useEffect(() => {
    document.title = titulo ? `${titulo} · Recetarium` : 'Recetarium'
  }, [titulo])
}
