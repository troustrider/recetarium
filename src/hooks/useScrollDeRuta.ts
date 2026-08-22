import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

const posiciones = new Map<string, number>()
const MARGEN = 600

let restaurando = false

/**
 * Arriba al navegar, y donde lo dejaste al volver. Antes subía arriba siempre,
 * también al retroceder, que obliga a buscar otra vez la receta por la que ibas.
 *
 * La vuelta se reintenta durante medio segundo en vez de una vez: la página que
 * se abandona sigue montada mientras se desvanece y llega por `lazy`, así que
 * durante unos fotogramas el documento no tiene alto suficiente y el navegador
 * recorta el salto. Se para en cuanto llega, no consume fotogramas de más.
 *
 * Mientras se restaura no se anota nada: los recortes intermedios pisarían la
 * posición buena y cada vuelta dejaría al usuario un poco más arriba.
 */
export default function useScrollDeRuta(): void {
  const { key } = useLocation()
  const tipo = useNavigationType()

  useEffect(() => {
    history.scrollRestoration = 'manual'
  }, [])

  useEffect(() => {
    const anotar = () => {
      if (!restaurando) posiciones.set(key, window.scrollY)
    }
    window.addEventListener('scroll', anotar, { passive: true })
    return () => window.removeEventListener('scroll', anotar)
  }, [key])

  useEffect(() => {
    const destino = tipo === 'POP' ? posiciones.get(key) ?? 0 : 0
    const limite = performance.now() + MARGEN
    let frame = 0

    restaurando = true
    const intentar = () => {
      window.scrollTo(0, destino)
      if (Math.abs(window.scrollY - destino) > 1 && performance.now() < limite) {
        frame = requestAnimationFrame(intentar)
        return
      }
      restaurando = false
    }
    intentar()

    return () => {
      cancelAnimationFrame(frame)
      restaurando = false
    }
  }, [key, tipo])
}
