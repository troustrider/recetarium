import { useRef, useState } from 'react'
import { animate, useMotionValue } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const DESVIO = 24
const ARRANQUE = 12
const PARTE = 0.4
const VELOCIDAD = 0.5

/** Lo que no se puede arrastrar por encima: lo que ya se arrastra o se desplaza. */
function intocable(destino: EventTarget | null): boolean {
  let nodo = destino instanceof Element ? destino : null
  while (nodo && nodo !== document.body) {
    const estilo = getComputedStyle(nodo)
    if (estilo.touchAction === 'none' || estilo.touchAction === 'pan-y') return true
    if (/(auto|scroll)/.test(estilo.overflowX) && nodo.scrollWidth > nodo.clientWidth) return true
    nodo = nodo.parentElement
  }
  return false
}

/**
 * Volver atrás arrastrando, siguiendo al dedo. La pantalla se mueve con la mano
 * y debajo asoma la anterior; al soltar, o se completa o vuelve a su sitio.
 *
 * El desplazamiento va en un `MotionValue` y no en estado de React: mover un
 * número a sesenta fotogramas por segundo redibujando el árbol entero deja el
 * gesto a tirones en cuanto la pantalla de debajo es el catálogo.
 *
 * El gesto no arranca en el canto: en iOS ese margen se lo queda WebKit para su
 * propia navegación y no entrega los eventos a la página. Empieza en cualquier
 * punto, y se descarta en cuanto el dedo se va en vertical, que es scroll.
 */
export default function useArrastreAtras(hayAnterior: boolean) {
  const navigate = useNavigate()
  const x = useMotionValue(0)
  const [arrastrando, setArrastrando] = useState(false)
  const inicio = useRef<{ x: number; y: number; t: number } | null>(null)
  const vivo = useRef(false)

  const soltar = () => {
    const empezo = inicio.current
    inicio.current = null
    if (!vivo.current) return
    vivo.current = false
    const ancho = window.innerWidth || 1
    const recorrido = x.get()
    const tiempo = Math.max(1, performance.now() - (empezo?.t ?? performance.now()))
    const completa = recorrido > ancho * PARTE || recorrido / tiempo > VELOCIDAD

    if (completa) {
      animate(x, ancho, { duration: 0.18, ease: [0.32, 0.72, 0, 1] }).then(() => {
        navigate(-1)
        x.set(0)
        setArrastrando(false)
      })
      return
    }
    animate(x, 0, { type: 'spring', stiffness: 500, damping: 42 }).then(() => setArrastrando(false))
  }

  const manejadores = {
    onTouchStart: (e: React.TouchEvent) => {
      if (!hayAnterior || e.touches.length !== 1 || intocable(e.target)) return
      const t = e.touches[0]
      inicio.current = { x: t.clientX, y: t.clientY, t: performance.now() }
    },
    onTouchMove: (e: React.TouchEvent) => {
      if (!inicio.current) return
      const t = e.touches[0]
      const dx = t.clientX - inicio.current.x
      const dy = t.clientY - inicio.current.y
      if (!vivo.current) {
        if (Math.abs(dy) > DESVIO) {
          inicio.current = null
          return
        }
        if (dx < ARRANQUE) return
        vivo.current = true
        setArrastrando(true)
      }
      x.set(Math.max(0, dx))
    },
    onTouchEnd: soltar,
    onTouchCancel: soltar,
  }

  return { x, arrastrando, manejadores }
}
