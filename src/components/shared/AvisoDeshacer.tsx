import { motion, AnimatePresence } from 'framer-motion'
import { Undo2, X } from 'lucide-react'
import { useDeshacer } from '../../context/DeshacerContext'

// Mismo hueco y misma silueta que el aviso de sincronización: en móvil por
// encima de la barra inferior, centrado y sin tapar el contenido.
function AvisoDeshacer() {
  const { pendiente, ejecutar, descartar } = useDeshacer()

  return (
    <AnimatePresence>
      {pendiente && (
        <motion.div
          className="fixed inset-x-0 bottom-16 sm:bottom-4 z-40 px-4 flex justify-center pointer-events-none"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          role="status"
        >
          <div className="pointer-events-auto flex items-center gap-3 max-w-md w-full bg-gray-900 dark:bg-gray-800 border border-gray-800 dark:border-gray-700 rounded-2xl shadow-lg px-4 py-3">
            <p className="flex-1 min-w-0 text-sm font-semibold text-white truncate">
              {pendiente.mensaje}
            </p>
            <button
              onClick={ejecutar}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-gray-900 bg-white rounded-xl hover:bg-gray-100 transition-colors"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Deshacer
            </button>
            <button
              onClick={descartar}
              aria-label="Cerrar aviso"
              className="relative shrink-0 text-gray-400 hover:text-white transition-colors after:content-[''] after:absolute after:-inset-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AvisoDeshacer
