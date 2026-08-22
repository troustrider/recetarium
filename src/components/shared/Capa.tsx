import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import useCapa from '../../hooks/useCapa'

const PANEL =
  'fixed inset-x-4 top-24 max-w-md mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-50 overflow-hidden'

/**
 * Fondo oscuro y panel para lo que se abre encima de la pantalla. Cierra al
 * tocar fuera, con Escape y con el botón de atrás, que en móvil es el gesto de
 * deslizar: sin eso, deslizar con un selector abierto te sacaba de la página.
 */
export default function Capa({ onCerrar, clases = PANEL, children }: {
  onCerrar: () => void
  clases?: string
  children: ReactNode
}) {
  useCapa(true, onCerrar, true)

  return (
    <>
      <motion.div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCerrar}
      />
      <motion.div
        className={clases}
        initial={{ opacity: 0, y: -16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        {children}
      </motion.div>
    </>
  )
}
