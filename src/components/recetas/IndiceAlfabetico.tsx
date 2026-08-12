import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  letras: string[]
  activa: string | null
  onSeleccionar: (letra: string) => void
}

function IndiceAlfabetico({ letras, activa, onSeleccionar }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const ultima = useRef<string | null>(null)
  const [arrastrando, setArrastrando] = useState(false)
  const [burbujaY, setBurbujaY] = useState(0)

  function recorrer(clientY: number) {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const i = Math.floor(((clientY - r.top) / r.height) * letras.length)
    const letra = letras[Math.max(0, Math.min(letras.length - 1, i))]
    setBurbujaY(Math.max(r.top, Math.min(r.bottom, clientY)))
    if (!letra || letra === ultima.current) return
    ultima.current = letra
    onSeleccionar(letra)
  }

  function soltar(e: React.PointerEvent) {
    if (!arrastrando) return
    e.currentTarget.releasePointerCapture?.(e.pointerId)
    setArrastrando(false)
    ultima.current = null
  }

  return (
    <>
      <div
        ref={ref}
        aria-label="Índice alfabético"
        className="fixed right-0 z-20 w-7 flex flex-col items-stretch select-none touch-none
                   top-[calc(env(safe-area-inset-top)+5.5rem)] bottom-24 sm:bottom-10"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture?.(e.pointerId)
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
            onClick={() => onSeleccionar(letra)}
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

      {/* Burbuja bajo el dedo — sin ella no se sabe dónde has soltado */}
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
