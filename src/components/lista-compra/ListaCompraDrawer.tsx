import { motion, AnimatePresence } from 'framer-motion'
import { X, Minus, Plus, Share2 } from 'lucide-react'
import { useListaCompraContext, useCompradosContext } from '../../context'
import ResumenIngrediente from './ResumenIngrediente'
import AnadirManual from './AnadirManual'
import { compartirLista } from '../../utils/compartirLista'

interface Props {
  open: boolean
  onClose: () => void
}

function ListaCompraDrawer({ open, onClose }: Props) {
  const { seleccionadas, listaCompra, coste, toggleReceta, setRaciones, vaciar, addExtra, removeExtra } = useListaCompraContext()
  const { comprados, toggle, limpiar } = useCompradosContext()
  const familias = [...new Set(listaCompra.map((i) => i.familia))]
  const vacia = listaCompra.length === 0

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed right-0 top-0 h-full w-full max-w-sm bg-white dark:bg-gray-900 z-50 flex flex-col shadow-2xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="font-display font-bold text-gray-900 dark:text-gray-100 text-lg">Lista de compra</h2>
                {!vacia && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {listaCompra.length} {listaCompra.length === 1 ? 'ingrediente' : 'ingredientes'}
                    {coste > 0 && <> · <span className="font-bold text-gray-500 dark:text-gray-300">≈ {coste.toFixed(2)} €</span></>}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
              {vacia && (
                <p className="text-sm text-gray-400 text-center pt-6 pb-2">
                  Añade recetas desde el catálogo o ítems a mano aquí abajo.
                </p>
              )}

              {seleccionadas.length > 0 && (
                <div className="flex flex-col gap-2">
                  {seleccionadas.map(({ receta, raciones }) => (
                    <div
                      key={receta.id}
                      className="flex items-center justify-between gap-3 px-3 py-2 bg-orange-50 dark:bg-orange-900/20 rounded-xl"
                    >
                      <span className="text-xs font-bold text-orange-700 dark:text-orange-400 truncate flex-1 min-w-0">
                        {receta.nombre}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <motion.button
                          onClick={() => {
                            if (raciones === 1) toggleReceta(receta)
                            else setRaciones(receta.id, raciones - 1)
                          }}
                          className="w-6 h-6 flex items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-800/60 transition-colors"
                          whileTap={{ scale: 0.85 }}
                          aria-label="Reducir raciones"
                        >
                          {raciones === 1
                            ? <X className="w-3 h-3" />
                            : <Minus className="w-3 h-3" />
                          }
                        </motion.button>
                        <span className="text-xs font-bold text-orange-700 dark:text-orange-300 w-5 text-center tabular-nums">
                          {raciones}
                        </span>
                        <motion.button
                          onClick={() => setRaciones(receta.id, raciones + 1)}
                          disabled={raciones >= 4}
                          className="w-6 h-6 flex items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-800/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          whileTap={{ scale: 0.85 }}
                          aria-label="Aumentar raciones"
                        >
                          <Plus className="w-3 h-3" />
                        </motion.button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {familias.map((familia) => (
                <section key={familia} className="bg-gray-50 dark:bg-gray-800 rounded-2xl overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">{familia}</h3>
                  </div>
                  <ul className="px-4">
                    {listaCompra
                      .filter((i) => i.familia === familia)
                      .sort((a, b) => Number(comprados.has(`${a.nombre}__${a.unidad}`)) - Number(comprados.has(`${b.nombre}__${b.unidad}`)))
                      .map((ing) => {
                        const clave = `${ing.nombre}__${ing.unidad}`
                        return (
                          <ResumenIngrediente
                            key={clave}
                            ingrediente={ing}
                            checked={comprados.has(clave)}
                            onToggle={() => toggle(clave)}
                            onRemove={ing.esExtra ? () => removeExtra(clave) : undefined}
                          />
                        )
                      })}
                  </ul>
                </section>
              ))}

              <AnadirManual onAdd={addExtra} />
            </div>

            {!vacia && (
              <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-2">
                <motion.button
                  onClick={() => compartirLista(listaCompra.filter((i) => !comprados.has(`${i.nombre}__${i.unidad}`)))}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-orange-500 rounded-xl hover:bg-orange-600 transition-colors"
                  whileTap={{ scale: 0.97 }}
                >
                  <Share2 className="w-4 h-4" />
                  Compartir lista
                </motion.button>
                <motion.button
                  onClick={() => { vaciar(); limpiar() }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                  whileTap={{ scale: 0.97 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                  </svg>
                  Vaciar lista
                </motion.button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

export default ListaCompraDrawer
