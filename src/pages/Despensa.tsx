import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDespensa, type EstadoDespensa, type IngredienteDespensa } from '../context/DespensaContext'
import { useListaCompraContext } from '../context/ListaCompraContext'

const FAMILIAS = [
  'verduras', 'frutas', 'carnes', 'pescados', 'lácteos',
  'cereales', 'legumbres', 'conservas', 'especias', 'bebidas', 'otros',
]

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// ——— Chip de ingrediente ———
interface ChipIngredienteProps {
  item: IngredienteDespensa
  onToggle: () => void
  onQuitar: () => void
}

function ChipIngrediente({ item, onToggle, onQuitar }: ChipIngredienteProps) {
  const esLleno = item.estado === 'lleno'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.15 }}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium cursor-pointer select-none transition-colors ${
        esLleno
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
          : 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30'
      }`}
      onClick={onToggle}
      title={esLleno ? 'Tienes bastante — clic para marcar como poco' : 'Te queda poco — clic para marcar como lleno'}
    >
      <span
        className={`w-2 h-2 rounded-full shrink-0 ${esLleno ? 'bg-emerald-500' : 'bg-amber-400'}`}
      />
      <span>{capitalize(item.nombre)}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onQuitar() }}
        className={`ml-1 leading-none opacity-50 hover:opacity-100 transition-opacity ${
          esLleno ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
        }`}
        aria-label={`Quitar ${item.nombre}`}
      >
        ×
      </button>
    </motion.div>
  )
}

// ——— Página ———
type Filtro = 'todos' | EstadoDespensa

function Despensa() {
  const { despensa, añadir, quitar, setEstado } = useDespensa()
  const { listaCompra } = useListaCompraContext()

  const [inputNombre, setInputNombre] = useState('')
  const [inputFamilia, setInputFamilia] = useState('otros')
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [mostrarForm, setMostrarForm] = useState(false)

  const totalLleno = despensa.filter((i) => i.estado === 'lleno').length
  const totalPoco = despensa.filter((i) => i.estado === 'poco').length

  const despensaFiltrada =
    filtro === 'todos' ? despensa : despensa.filter((i) => i.estado === filtro)

  // Agrupar por familia
  const porFamilia = despensaFiltrada.reduce<Record<string, IngredienteDespensa[]>>((acc, item) => {
    const fam = item.familia || 'otros'
    if (!acc[fam]) acc[fam] = []
    acc[fam].push(item)
    return acc
  }, {})

  const familiasOrdenadas = Object.keys(porFamilia).sort()

  function handleAñadir() {
    const nombre = inputNombre.trim()
    if (!nombre) return
    añadir(nombre, inputFamilia)
    setInputNombre('')
  }

  function toggleEstado(item: IngredienteDespensa) {
    setEstado(item.nombre, item.estado === 'lleno' ? 'poco' : 'lleno')
  }

  function importarDeLista() {
    for (const ing of listaCompra) {
      añadir(ing.nombre, ing.familia)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-500 dark:text-orange-400 mb-1">
            Ingredientes disponibles
          </p>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-gray-100">Despensa</h1>
          {despensa.length > 0 && (
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {totalLleno} llenos
              </span>
              {totalPoco > 0 && (
                <span className="text-xs font-semibold text-amber-500 dark:text-amber-400">
                  {totalPoco} pocos
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {listaCompra.length > 0 && (
            <motion.button
              onClick={importarDeLista}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-orange-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
              whileTap={{ scale: 0.97 }}
              title="Añade a tu despensa todos los ingredientes de la lista de compra actual"
            >
              Importar de la lista
            </motion.button>
          )}
          <motion.button
            onClick={() => setMostrarForm((v) => !v)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors"
            whileTap={{ scale: 0.97 }}
          >
            {mostrarForm ? 'Cancelar' : '+ Añadir'}
          </motion.button>
        </div>
      </div>

      {/* Formulario de añadir */}
      <AnimatePresence>
        {mostrarForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex gap-2 overflow-hidden"
          >
            <input
              type="text"
              placeholder="Ingrediente..."
              value={inputNombre}
              onChange={(e) => setInputNombre(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAñadir()}
              className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 dark:text-gray-100"
              autoFocus
            />
            <select
              value={inputFamilia}
              onChange={(e) => setInputFamilia(e.target.value)}
              className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 dark:text-gray-100 text-gray-700 dark:text-gray-300"
            >
              {FAMILIAS.map((f) => (
                <option key={f} value={f}>{capitalize(f)}</option>
              ))}
            </select>
            <motion.button
              onClick={handleAñadir}
              className="px-4 py-2 text-sm font-semibold bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
              whileTap={{ scale: 0.97 }}
            >
              Añadir
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filtros por estado */}
      {despensa.length > 0 && (
        <div className="flex gap-2">
          {(['todos', 'lleno', 'poco'] as Filtro[]).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${
                filtro === f
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {f === 'todos' ? 'Todos' : f === 'lleno' ? `Lleno (${totalLleno})` : `Poco (${totalPoco})`}
            </button>
          ))}
        </div>
      )}

      {/* Cuerpo */}
      {despensa.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="text-orange-300 dark:text-orange-700" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </div>
          <h2 className="font-display text-lg font-bold text-gray-700 dark:text-gray-300 mb-1">Tu despensa está vacía</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs mx-auto">
            Añade ingredientes o importa desde la lista de la compra para saber qué tienes en casa.
          </p>
        </div>
      ) : despensaFiltrada.length === 0 ? (
        <p className="text-center py-10 text-sm text-gray-400 dark:text-gray-500">
          No hay ingredientes en este estado.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {familiasOrdenadas.map((familia) => (
            <div key={familia}>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-3">
                {capitalize(familia)}
              </p>
              <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {porFamilia[familia].map((item) => (
                    <ChipIngrediente
                      key={item.nombre}
                      item={item}
                      onToggle={() => toggleEstado(item)}
                      onQuitar={() => quitar(item.nombre)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Leyenda */}
      {despensa.length > 0 && (
        <div className="flex items-center gap-4 pt-2 border-t border-gray-100 dark:border-gray-800">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-300 dark:text-gray-600">
            Clic en un chip para cambiar estado
          </p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[10px] text-gray-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> lleno
            </span>
            <span className="flex items-center gap-1 text-[10px] text-gray-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> poco
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default Despensa
