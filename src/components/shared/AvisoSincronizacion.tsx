import { useEffect, useSyncExternalStore } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CloudOff, RotateCw } from 'lucide-react'
import { suscribir, leer, reintentarTodo } from '../../utils/sincronizacion'

function listar(nombres: string[]) {
  if (nombres.length === 1) return nombres[0]
  return `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`
}

// Un guardado que falla ya no desaparece en silencio: la app deja de fingir que
// el cambio está compartido con el otro dispositivo y ofrece reintentar.
function AvisoSincronizacion() {
  const { guardando, fallos } = useSyncExternalStore(suscribir, leer, leer)

  // Volver a tener red es el momento obvio para reintentar solo.
  useEffect(() => {
    const alVolver = () => { void reintentarTodo() }
    window.addEventListener('online', alVolver)
    return () => window.removeEventListener('online', alVolver)
  }, [])

  return (
    <AnimatePresence>
      {fallos.length > 0 && (
        <motion.div
          className="fixed inset-x-0 bottom-16 sm:bottom-4 z-40 px-4 flex justify-center pointer-events-none"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          role="status"
        >
          <div className="pointer-events-auto flex items-center gap-3 max-w-md w-full bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl shadow-lg px-4 py-3">
            <CloudOff className="shrink-0 w-5 h-5 text-amber-600 dark:text-amber-400" strokeWidth={2.2} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight">
                Sin guardar en el móvil del otro
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-snug mt-0.5">
                No se ha podido guardar {listar(fallos)}. El cambio sigue aquí, pero aún no se comparte.
              </p>
            </div>
            <button
              onClick={() => { void reintentarTodo() }}
              disabled={guardando}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-white bg-amber-600 rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${guardando ? 'animate-spin' : ''}`} />
              Reintentar
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AvisoSincronizacion
