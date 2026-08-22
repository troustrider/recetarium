import { useEffect, useRef, useState } from 'react'
import { animate, useMotionValue } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'

const DESVIO = 24
const ARRANQUE = 12
const PARTE = 0.4
const VELOCIDAD = 0.5
const CADUCA = 120
const MUESTRA = 4

/** Lo que no se puede arrastrar por encima: lo que ya se arrastra o se desplaza. */
function intocable(destino: EventTarget | null): boolean {
  // El modo cocina —y cualquier capa que bloquee el scroll de la raíz— ocupa la
  // pantalla entera con sus propias flechas y no cuelga de la pila de rutas.
  if (document.documentElement.style.overflow === 'hidden') return true
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
 * Los oyentes son nativos y no de React porque `touchmove` necesita cancelarse:
 * React los instala en pasivo y allí `preventDefault` no hace nada, así que el
 * navegador seguía desplazando en vertical durante el arrastre.
 *
 * El gesto no arranca en el canto: en iOS ese margen se lo queda WebKit para su
 * propia navegación y no entrega los eventos a la página. Empieza en cualquier
 * punto, y se descarta en cuanto el dedo se va en vertical, que es scroll.
 */
export default function useArrastreAtras(hayAnterior: boolean) {
  const navigate = useNavigate()
  const { key } = useLocation()
  const contenedor = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const [arrastrando, setArrastrando] = useState(false)
  const [porGesto, setPorGesto] = useState(false)

  // La ruta que trajo el gesto ya se montó sin animación; se apaga aquí para que
  // la siguiente transición vuelva a animarse.
  const clave = useRef(key)
  useEffect(() => {
    if (clave.current === key) return
    clave.current = key
    setPorGesto(false)
  }, [key])

  useEffect(() => {
    const nodo = contenedor.current
    if (!nodo) return

    let inicio: { x: number; y: number } | null = null
    let ultimo: { x: number; t: number } | null = null
    let velocidad = 0
    let vivo = false

    const empezar = (e: TouchEvent) => {
      inicio = null
      if (!hayAnterior || e.touches.length !== 1 || intocable(e.target)) return
      const t = e.touches[0]
      inicio = { x: t.clientX, y: t.clientY }
      ultimo = { x: t.clientX, t: performance.now() }
      velocidad = 0
      x.set(0)
    }

    const mover = (e: TouchEvent) => {
      if (!inicio) return
      const t = e.touches[0]
      const dx = t.clientX - inicio.x
      const dy = t.clientY - inicio.y
      if (!vivo) {
        if (Math.abs(dy) > DESVIO) {
          inicio = null
          return
        }
        // Más horizontal que vertical, no solo suficientemente largo: en
        // diagonal el dedo casi siempre está intentando desplazar la página.
        if (dx < ARRANQUE || dx < Math.abs(dy)) return
        vivo = true
        setArrastrando(true)
      }
      // Sin esto el navegador sigue desplazando en vertical a la vez que el dedo
      // arrastra, y el gesto va a tirones justo donde más se nota.
      if (e.cancelable) e.preventDefault()
      const ahora = performance.now()
      // Dos eventos pegados dan una velocidad disparatada por dividir entre casi
      // cero; a sesenta hercios el intervalo real es de dieciséis milisegundos.
      if (ultimo && ahora - ultimo.t >= MUESTRA) velocidad = (t.clientX - ultimo.x) / (ahora - ultimo.t)
      ultimo = { x: t.clientX, t: ahora }
      x.set(Math.max(0, dx))
    }

    const soltar = () => {
      inicio = null
      if (!vivo) return
      vivo = false
      const ancho = window.innerWidth || 1
      const recorrido = x.get()
      // Un dedo que se para antes de levantarse no lleva impulso, por mucho que
      // el tramo anterior fuera rápido.
      const impulso = ultimo && performance.now() - ultimo.t < CADUCA ? velocidad : 0
      const completa = recorrido > ancho * PARTE || impulso > VELOCIDAD

      if (completa) {
        // El valor se queda fuera de cuadro a propósito: la pantalla que se va
        // sigue atada a él mientras se desmonta, y devolverlo a cero la traería
        // de un salto encima de la que acaba de llegar. Lo limpia el arranque
        // del siguiente gesto.
        animate(x, ancho, { duration: 0.18, ease: [0.32, 0.72, 0, 1] }).then(() => {
          setPorGesto(true)
          setArrastrando(false)
          navigate(-1)
        })
        return
      }
      animate(x, 0, { type: 'spring', stiffness: 500, damping: 42 }).then(() => setArrastrando(false))
    }

    nodo.addEventListener('touchstart', empezar, { passive: true })
    nodo.addEventListener('touchmove', mover, { passive: false })
    nodo.addEventListener('touchend', soltar, { passive: true })
    nodo.addEventListener('touchcancel', soltar, { passive: true })
    return () => {
      nodo.removeEventListener('touchstart', empezar)
      nodo.removeEventListener('touchmove', mover)
      nodo.removeEventListener('touchend', soltar)
      nodo.removeEventListener('touchcancel', soltar)
    }
  }, [hayAnterior, navigate, x])

  return { x, arrastrando, porGesto, contenedor }
}
