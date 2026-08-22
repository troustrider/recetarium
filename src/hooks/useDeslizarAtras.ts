import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const BORDE = 28
const RECORRIDO = 70
const DESVIO = 45

/**
 * Volver atrás deslizando desde el canto izquierdo. Instalada como PWA no hay
 * gesto del navegador, que es justo donde más falta hace.
 *
 * Tiene que arrancar en el borde y no en cualquier punto: un deslizamiento libre
 * chocaría con el arrastre de chips del planificador y con los carruseles
 * horizontales. Y se calla con el modo cocina abierto, que bloquea el scroll de
 * la raíz y tiene sus propias flechas para moverse entre pasos.
 */
export default function useDeslizarAtras(): void {
  const navigate = useNavigate()

  useEffect(() => {
    let inicio: { x: number; y: number } | null = null

    const empezar = (e: TouchEvent) => {
      const t = e.touches[0]
      inicio = e.touches.length === 1 && t.clientX <= BORDE ? { x: t.clientX, y: t.clientY } : null
    }

    const mover = (e: TouchEvent) => {
      if (!inicio) return
      const t = e.touches[0]
      if (Math.abs(t.clientY - inicio.y) > DESVIO) {
        inicio = null
        return
      }
      if (t.clientX - inicio.x < RECORRIDO) return
      inicio = null
      if (document.documentElement.style.overflow === 'hidden') return
      // Sin nada detrás —se ha entrado por un enlace directo— atrás no puede ser
      // salir de la app: el gesto lleva al catálogo, que es el sitio de partida.
      const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
      if (idx > 0) navigate(-1)
      else navigate('/')
    }

    const soltar = () => {
      inicio = null
    }

    window.addEventListener('touchstart', empezar, { passive: true })
    window.addEventListener('touchmove', mover, { passive: true })
    window.addEventListener('touchend', soltar, { passive: true })
    window.addEventListener('touchcancel', soltar, { passive: true })
    return () => {
      window.removeEventListener('touchstart', empezar)
      window.removeEventListener('touchmove', mover)
      window.removeEventListener('touchend', soltar)
      window.removeEventListener('touchcancel', soltar)
    }
  }, [navigate])
}
