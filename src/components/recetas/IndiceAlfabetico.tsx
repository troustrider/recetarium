import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  letras: string[]
  onSeleccionar: (letra: string) => void
}

// Línea de referencia: una cabecera pasa a ser "la sección que se está viendo"
// en cuanto sube por encima de ella. Va justo debajo de la barra superior.
const LINEA = 140

function IndiceAlfabetico({ letras, onSeleccionar }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const ultima = useRef<string | null>(null)
  const delPuntero = useRef(false)
  const pendiente = useRef<number | null>(null)
  const frame = useRef(0)

  const [arrastrando, setArrastrando] = useState(false)
  const [burbujaY, setBurbujaY] = useState(0)
  const [enPantalla, setEnPantalla] = useState<string | null>(null)
  const [bajoElDedo, setBajoElDedo] = useState<string | null>(null)

  const activa = bajoElDedo ?? enPantalla

  const atender = useCallback(() => {
    frame.current = 0
    const y = pendiente.current
    const el = ref.current
    if (y == null || !el) return
    const r = el.getBoundingClientRect()
    const i = Math.floor(((y - r.top) / r.height) * letras.length)
    const letra = letras[Math.max(0, Math.min(letras.length - 1, i))]
    setBurbujaY(Math.max(r.top, Math.min(r.bottom, y)))
    if (!letra || letra === ultima.current) return
    ultima.current = letra
    setBajoElDedo(letra)
    onSeleccionar(letra)
  }, [letras, onSeleccionar])

  const recorrer = useCallback(
    (clientY: number) => {
      pendiente.current = clientY
      if (!frame.current) frame.current = requestAnimationFrame(atender)
    },
    [atender]
  )

  function soltar(e: React.PointerEvent) {
    if (!arrastrando) return
    e.currentTarget.releasePointerCapture?.(e.pointerId)
    // Un clic de ratón levanta el dedo dentro del mismo fotograma: hay que
    // atender lo que quede pendiente, no tirarlo.
    if (frame.current) {
      cancelAnimationFrame(frame.current)
      atender()
    }
    pendiente.current = null
    setArrastrando(false)
    setBajoElDedo(null)
    ultima.current = null
  }

  useEffect(() => {
    let pedido = false
    const calcular = () => {
      pedido = false
      const cabeceras = document.querySelectorAll<HTMLElement>('[data-letra]')
      let actual: string | null = cabeceras[0]?.dataset.letra ?? null
      for (const h of cabeceras) {
        if (h.getBoundingClientRect().top > LINEA) break
        actual = h.dataset.letra ?? actual
      }
      setEnPantalla(actual)
    }
    const alScroll = () => {
      if (pedido) return
      pedido = true
      requestAnimationFrame(calcular)
    }
    alScroll()
    window.addEventListener('scroll', alScroll, { passive: true })
    window.addEventListener('resize', alScroll)
    return () => {
      window.removeEventListener('scroll', alScroll)
      window.removeEventListener('resize', alScroll)
    }
  }, [letras])

  useEffect(() => () => { if (frame.current) cancelAnimationFrame(frame.current) }, [])

  return (
    <>
      <div
        ref={ref}
        aria-label="Índice alfabético"
        className="fixed right-0 z-20 w-7 flex flex-col items-stretch select-none touch-none
                   top-[calc(env(safe-area-inset-top)+5.5rem)] bottom-24 sm:bottom-10"
        onPointerDown={(e) => {
          if (e.cancelable) e.preventDefault()
          e.currentTarget.setPointerCapture?.(e.pointerId)
          delPuntero.current = true
          setArrastrando(true)
          ultima.current = null
          recorrer(e.clientY)
        }}
        onPointerMove={(e) => arrastrando && recorrer(e.clientY)}
        onPointerUp={soltar}
        onPointerCancel={soltar}
      >
        {letras.map((letra) => (
          <button
            key={letra}
            tabIndex={-1}
            onClick={() => {
              if (delPuntero.current) {
                delPuntero.current = false
                return
              }
              onSeleccionar(letra)
            }}
            className={`flex-1 flex items-center justify-center text-[10px] font-bold leading-none tabular-nums transition-colors ${
              letra === activa
                ? 'text-orange-600 dark:text-orange-400'
                : 'text-gray-400/70 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400'
            }`}
          >
            {letra}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {arrastrando && activa && (
          <motion.div
            className="fixed right-10 z-30 pointer-events-none w-12 h-12 rounded-2xl bg-gray-900/90 dark:bg-gray-100/90 backdrop-blur flex items-center justify-center shadow-lg"
            style={{ top: burbujaY - 24 }}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.12 }}
          >
            <span className="font-display text-xl font-bold text-white dark:text-gray-900">{activa}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default IndiceAlfabetico
