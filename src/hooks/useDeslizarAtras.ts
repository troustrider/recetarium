import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const BORDE = 40
const RECORRIDO_BORDE = 60
const RECORRIDO_LIBRE = 110
const DESVIO = 50

/**
 * Volver atrás deslizando a la derecha. Instalada como PWA no hay gesto del
 * navegador, que es donde más falta hace.
 *
 * No basta con el canto izquierdo, que es lo idiomático en iOS: WebKit se queda
 * ese gesto para su propia navegación y no entrega los `touchmove` a la página,
 * así que en el iPhone un gesto anclado al borde no llega a verse nunca. Por eso
 * también vale empezando en cualquier punto, pidiendo a cambio casi el doble de
 * recorrido para que un arrastre despistado no te saque de la pantalla.
 *
 * Lo que se descarta antes de mirar el recorrido: lo que se arrastra —los chips
 * del planificador declaran `touch-action: none`—, lo que se desplaza en
 * horizontal —carruseles y tablas— y el modo cocina, que bloquea el scroll de la
 * raíz y tiene sus propias flechas.
 */
function intocable(destino: EventTarget | null): boolean {
  let nodo = destino instanceof Element ? destino : null
  while (nodo && nodo !== document.body) {
    const estilo = getComputedStyle(nodo)
    if (estilo.touchAction === 'none' || estilo.touchAction === 'pan-y') return true
    const desplazable = /(auto|scroll)/.test(estilo.overflowX) && nodo.scrollWidth > nodo.clientWidth
    if (desplazable) return true
    nodo = nodo.parentElement
  }
  return false
}

export default function useDeslizarAtras(): void {
  const navigate = useNavigate()

  useEffect(() => {
    let inicio: { x: number; y: number; borde: boolean } | null = null

    const empezar = (e: TouchEvent) => {
      const t = e.touches[0]
      if (e.touches.length !== 1 || intocable(e.target)) {
        inicio = null
        return
      }
      inicio = { x: t.clientX, y: t.clientY, borde: t.clientX <= BORDE }
    }

    const mover = (e: TouchEvent) => {
      if (!inicio) return
      const t = e.touches[0]
      if (Math.abs(t.clientY - inicio.y) > DESVIO) {
        inicio = null
        return
      }
      const recorrido = inicio.borde ? RECORRIDO_BORDE : RECORRIDO_LIBRE
      if (t.clientX - inicio.x < recorrido) return
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
