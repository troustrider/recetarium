import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart } from 'lucide-react'
import { useDespensa, useListaCompraContext } from '../../context'
import { mismoIngrediente, caducaPronto, porAgotarse, diasHastaCaducidad } from '../../utils/despensa'

const SNOOZE_KEY = 'recetarium-aviso-despensa'

function leerVistos(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SNOOZE_KEY) ?? '[]')
  } catch {
    return []
  }
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function motivo(item: { estado: string; caducidad?: string }): string {
  if (item.caducidad && caducaPronto(item)) {
    const dias = diasHastaCaducidad(item.caducidad)
    if (dias < 0) return 'caducado'
    if (dias === 0) return 'caduca hoy'
    if (dias === 1) return 'caduca mañana'
    return `caduca en ${dias} días`
  }
  return 'queda poco'
}

// Aviso al abrir la app: ingredientes en "poco" o a punto de caducar que aún
// no están en la lista de la compra. Recuerda lo descartado para no insistir.
function AvisoDespensa() {
  const { despensa } = useDespensa()
  const { listaCompra, addExtra } = useListaCompraContext()
  const navigate = useNavigate()
  const [vistos, setVistos] = useState<string[]>(leerVistos)

  const candidatos = useMemo(
    () =>
      porAgotarse(despensa).filter(
        (d) => !listaCompra.some((i) => mismoIngrediente(i.nombre, d.nombre))
      ),
    [despensa, listaCompra]
  )

  // Abierto mientras haya algún candidato que aún no se haya descartado.
  const abierto = candidatos.some((c) => !vistos.includes(c.nombre))

  function recordarVistos() {
    const nombres = candidatos.map((c) => c.nombre)
    localStorage.setItem(SNOOZE_KEY, JSON.stringify(nombres))
    setVistos(nombres)
  }

  function añadirTodos() {
    for (const c of candidatos) {
      addExtra({ nombre: c.nombre, cantidad: 1, unidad: 'ud', familia: c.familia })
    }
    recordarVistos()
  }

  function elegirManualmente() {
    recordarVistos()
    navigate('/despensa?filtro=aviso')
  }

  return (
    <AnimatePresence>
      {abierto && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={recordarVistos}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Ingredientes por agotarse"
            className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
            initial={{ y: 24, scale: 0.96 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 24, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 pb-4">
              <div className="w-11 h-11 mb-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              </div>
              <h2 className="font-display text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                Se {candidatos.length === 1 ? 'está acabando 1 ingrediente' : `están acabando ${candidatos.length} ingredientes`}
              </h2>
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                ¿Los apunto en la lista de la compra?
              </p>
              <ul className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                {candidatos.map((c) => (
                  <li key={c.nombre} className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-200">{capitalize(c.nombre)}</span>
                    <span className={`text-[11px] font-semibold shrink-0 ${
                      c.caducidad && caducaPronto(c)
                        ? 'text-red-500 dark:text-red-400'
                        : 'text-amber-500 dark:text-amber-400'
                    }`}>
                      {motivo(c)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-2 p-4 pt-2 bg-gray-50 dark:bg-gray-800/50">
              <motion.button
                onClick={añadirTodos}
                className="w-full py-2.5 text-sm font-bold bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
                whileTap={{ scale: 0.98 }}
              >
                Añadir {candidatos.length === 1 ? 'a la lista' : 'todos a la lista'}
              </motion.button>
              <div className="flex gap-2">
                <motion.button
                  onClick={elegirManualmente}
                  className="flex-1 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-orange-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                  whileTap={{ scale: 0.98 }}
                >
                  Elegir yo
                </motion.button>
                <motion.button
                  onClick={recordarVistos}
                  className="flex-1 py-2.5 text-sm font-semibold text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  whileTap={{ scale: 0.98 }}
                >
                  Ahora no
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AvisoDespensa
