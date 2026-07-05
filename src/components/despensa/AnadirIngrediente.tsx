import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import { useDespensa } from '../../context/DespensaContext'
import { FAMILIAS, estaEnDespensa } from '../../utils/despensa'
import { normalizar } from '../../utils/ingredientes'
import useIngredientesConocidos from '../../hooks/useIngredientesConocidos'

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

interface Props {
  abierto: boolean
  onClose: () => void
}

// Menú de añadir en hoja inferior: nombre con sugerencias del recetario,
// familia y caducidad opcional. Queda abierto para añadir varios seguidos.
function AnadirIngrediente({ abierto, onClose }: Props) {
  const { despensa, añadir } = useDespensa()
  const conocidos = useIngredientesConocidos()

  const [nombre, setNombre] = useState('')
  const [familia, setFamilia] = useState('otros')
  const [caducidad, setCaducidad] = useState('')

  const nq = normalizar(nombre)
  const sugerencias = nq
    ? conocidos.filter((s) => normalizar(s.nombre).includes(nq) && !estaEnDespensa(s.nombre, despensa)).slice(0, 4)
    : []

  const yaExiste = nombre.trim().length > 0 && estaEnDespensa(nombre, despensa)
  const puedeAñadir = nombre.trim().length > 1 && !yaExiste

  function elegirSugerencia(s: { nombre: string; familia: string }) {
    setNombre(s.nombre)
    setFamilia(s.familia)
  }

  function handleAñadir() {
    if (!puedeAñadir) return
    añadir(nombre, familia, caducidad || undefined)
    setNombre('')
    setCaducidad('')
  }

  return (
    <AnimatePresence>
      {abierto && (
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
            aria-label="Añadir ingrediente a la despensa"
            className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-3xl px-5 pt-3 pb-8 sm:pb-6"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-9 h-1 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto mb-4" />

            <div className="flex items-start justify-between gap-3 mb-4">
              <h2 className="font-display text-xl font-bold text-gray-900 dark:text-gray-100">
                Añadir a la despensa
              </h2>
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAñadir()}
              placeholder="Ingrediente..."
              autoFocus
              className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-orange-400 dark:focus:ring-orange-600 transition-all"
            />

            {sugerencias.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {sugerencias.map((s) => (
                  <button
                    key={s.nombre}
                    onClick={() => elegirSugerencia(s)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-full bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/30 transition-colors"
                  >
                    {capitalize(s.nombre)}
                  </button>
                ))}
              </div>
            )}
            {yaExiste && (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                Ya está en la despensa.
              </p>
            )}

            <div className="flex gap-2 mt-3 mb-4">
              <select
                value={familia}
                onChange={(e) => setFamilia(e.target.value)}
                className="flex-1 px-3 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-orange-400 dark:focus:ring-orange-600 cursor-pointer"
                aria-label="Familia"
              >
                {FAMILIAS.map((f) => (
                  <option key={f} value={f}>{capitalize(f)}</option>
                ))}
              </select>
              <input
                type="date"
                value={caducidad}
                onChange={(e) => setCaducidad(e.target.value)}
                className="px-3 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-orange-400 dark:focus:ring-orange-600 cursor-pointer"
                title="Fecha de caducidad (opcional)"
                aria-label="Fecha de caducidad (opcional)"
              />
            </div>

            <motion.button
              onClick={handleAñadir}
              disabled={!puedeAñadir}
              className={`w-full flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-colors ${
                puedeAñadir
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                  : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 cursor-default'
              }`}
              whileTap={puedeAñadir ? { scale: 0.98 } : undefined}
            >
              <Plus className="w-4 h-4" />
              Añadir a la despensa
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AnadirIngrediente
