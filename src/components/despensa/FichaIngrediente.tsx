import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Check, Trash2, X } from 'lucide-react'
import type { IngredienteDespensa, EstadoDespensa } from '../../context/DespensaContext'
import { FAMILIAS } from '../../utils/despensa'

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

interface Props {
  item: IngredienteDespensa | null
  enLista: boolean
  onEstado: (estado: EstadoDespensa) => void
  onCaducidad: (caducidad?: string) => void
  onFamilia: (familia: string) => void
  onALista: () => void
  onQuitar: () => void
  onClose: () => void
}

// Ficha de ingrediente en hoja inferior: concentra todas las acciones
// que antes eran iconos sueltos en el chip.
function FichaIngrediente({ item, enLista, onEstado, onCaducidad, onFamilia, onALista, onQuitar, onClose }: Props) {
  return (
    <AnimatePresence>
      {item && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Ficha de ${item.nombre}`}
            className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-3xl px-5 pt-3 pb-8 sm:pb-6"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-9 h-1 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto mb-4" />

            <div className="flex items-start justify-between gap-3 mb-5">
              <div>
                <h2 className="font-display text-xl font-bold text-gray-900 dark:text-gray-100">
                  {capitalize(item.nombre)}
                </h2>
                <select
                  value={item.familia}
                  onChange={(e) => onFamilia(e.target.value)}
                  className="mt-1 -ml-1 px-1 py-0.5 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 bg-transparent border-0 outline-none cursor-pointer hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                  aria-label="Cambiar familia"
                >
                  {FAMILIAS.map((f) => (
                    <option key={f} value={f}>{capitalize(f)}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-2 mb-3">
              <button
                onClick={() => onEstado('lleno')}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl border transition-colors ${
                  item.estado === 'lleno'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-300'
                    : 'bg-white border-gray-200 text-gray-400 hover:text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-500 dark:hover:text-gray-300'
                }`}
              >
                De sobra
              </button>
              <button
                onClick={() => onEstado('poco')}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl border transition-colors ${
                  item.estado === 'poco'
                    ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-300'
                    : 'bg-white border-gray-200 text-gray-400 hover:text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-500 dark:hover:text-gray-300'
                }`}
              >
                Queda poco
              </button>
            </div>

            <label className="flex items-center justify-between gap-3 px-4 py-2.5 mb-4 text-sm rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 cursor-pointer">
              Caducidad
              <input
                type="date"
                value={item.caducidad ?? ''}
                onChange={(e) => onCaducidad(e.target.value || undefined)}
                className="bg-transparent text-right text-sm text-gray-700 dark:text-gray-200 outline-none cursor-pointer"
              />
            </label>

            <motion.button
              onClick={onALista}
              disabled={enLista}
              className={`w-full flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-colors mb-2 ${
                enLista
                  ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 cursor-default'
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
              whileTap={enLista ? undefined : { scale: 0.98 }}
            >
              {enLista ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
              {enLista ? 'Ya está en la lista' : 'Mandar a la lista de la compra'}
            </motion.button>

            <button
              onClick={onQuitar}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-red-500 hover:text-red-600 dark:text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Quitar de la despensa
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default FichaIngrediente
