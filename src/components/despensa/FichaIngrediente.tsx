import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Check, Trash2, X, Pencil } from 'lucide-react'
import { useDespensa, type IngredienteDespensa, type CambiosIngrediente } from '../../context/DespensaContext'
import { FAMILIAS, mismoIngrediente } from '../../utils/despensa'
import { UNIDADES_DESPENSA, requiereCantidad, unidadPorDefecto } from '../../utils/cantidades'
import { diasTrasAbrir } from '../../utils/trasAbrir'
import { sumarDias } from '../../utils/caducidadEstimada'
import { capitalize } from '../../utils/ingredientes'

interface Props {
  item: IngredienteDespensa | null
  enLista: boolean
  onEditar: (cambios: CambiosIngrediente) => void
  onALista: () => void
  onQuitar: () => void
  onClose: () => void
}

function FichaIngrediente({ item, enLista, onEditar, onALista, onQuitar, onClose }: Props) {
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
            className="w-full max-w-md max-h-[88dvh] overflow-y-auto overflow-x-hidden overscroll-contain bg-white dark:bg-gray-900 rounded-t-3xl px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+2rem)] sm:pb-6"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-9 h-1 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto mb-4" />
            {/* La key reinicia el modo edición al cambiar de ingrediente */}
            <Cuerpo
              key={item.nombre}
              item={item}
              enLista={enLista}
              onEditar={onEditar}
              onALista={onALista}
              onQuitar={onQuitar}
              onClose={onClose}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Cuerpo({ item, enLista, onEditar, onALista, onQuitar, onClose }: Props & { item: IngredienteDespensa }) {
  const { despensa } = useDespensa()
  const [editando, setEditando] = useState(false)
  const [borrador, setBorrador] = useState(item.nombre)

  const nombreLimpio = borrador.trim().toLowerCase()
  const chocaConOtro =
    nombreLimpio !== item.nombre &&
    despensa.some((i) => i.nombre !== item.nombre && mismoIngrediente(i.nombre, nombreLimpio))
  const puedeGuardar = nombreLimpio.length > 1 && !chocaConOtro

  function guardarNombre() {
    if (!puedeGuardar) return
    if (nombreLimpio !== item.nombre) onEditar({ nombre: nombreLimpio })
    setEditando(false)
  }

  function cancelar() {
    setBorrador(item.nombre)
    setEditando(false)
  }

  const unidad = item.unidad ?? unidadPorDefecto(item.familia)
  const sugerida = item.cantidad == null && requiereCantidad(item.familia)

  return (
    <>
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex-1 min-w-0">
          {editando ? (
            <>
              <input
                type="text"
                value={borrador}
                onChange={(e) => setBorrador(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') guardarNombre()
                  if (e.key === 'Escape') cancelar()
                }}
                autoFocus
                aria-label="Nombre del ingrediente"
                className="w-full min-w-0 px-3 py-2 font-display text-lg font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-orange-400 dark:focus:ring-orange-600"
              />
              {chocaConOtro && (
                <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                  Ya hay otro ingrediente con ese nombre.
                </p>
              )}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={guardarNombre}
                  disabled={!puedeGuardar}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:bg-gray-100 disabled:text-gray-400 dark:disabled:bg-gray-800 dark:disabled:text-gray-500 transition-colors"
                >
                  Guardar
                </button>
                <button
                  onClick={cancelar}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </>
          ) : (
            <h2 className="font-display text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
              {capitalize(item.nombre)}
            </h2>
          )}
          <select
            value={item.familia}
            onChange={(e) => onEditar({ familia: e.target.value })}
            className="mt-1 max-w-full px-1 py-0.5 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 bg-transparent border-0 outline-none cursor-pointer hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
            aria-label="Cambiar familia"
          >
            {(FAMILIAS.includes(item.familia) ? FAMILIAS : [item.familia, ...FAMILIAS]).map((f) => (
              <option key={f} value={f}>{capitalize(f)}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center shrink-0">
          {!editando && (
            <button
              onClick={() => setEditando(true)}
              className="p-2 text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
              aria-label="Editar nombre"
              title="Editar nombre"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <button
          onClick={() => onEditar({ estado: 'lleno' })}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-xl border transition-colors ${
            item.estado === 'lleno'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-300'
              : 'bg-white border-gray-200 text-gray-400 hover:text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-500 dark:hover:text-gray-300'
          }`}
        >
          De sobra
        </button>
        <button
          onClick={() => onEditar({ estado: 'poco' })}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-xl border transition-colors ${
            item.estado === 'poco'
              ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-300'
              : 'bg-white border-gray-200 text-gray-400 hover:text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-500 dark:hover:text-gray-300'
          }`}
        >
          Queda poco
        </button>
      </div>

      <div className="mb-4">
        <div
          className={`flex items-center justify-between gap-2 px-4 py-2 text-sm rounded-xl border ${
            sugerida
              ? 'border-orange-200 dark:border-orange-800/60 bg-orange-50/40 dark:bg-orange-900/10'
              : 'border-gray-200 dark:border-gray-700'
          }`}
        >
          <span className="text-gray-500 dark:text-gray-400 shrink-0">Cantidad</span>
          <div className="flex items-center gap-1 min-w-0">
            <input
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              value={item.cantidad ?? ''}
              onChange={(e) =>
                onEditar(
                  e.target.value === ''
                    ? { cantidad: null }
                    : { cantidad: Math.max(0, Number(e.target.value)), unidad }
                )
              }
              placeholder="—"
              aria-label="Cantidad en la despensa"
              className="w-20 min-w-0 px-2 py-1.5 text-right text-base sm:text-sm bg-transparent text-gray-700 dark:text-gray-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-orange-400 dark:focus:ring-orange-600 transition-colors"
            />
            <select
              value={unidad}
              onChange={(e) => onEditar({ unidad: e.target.value })}
              disabled={item.cantidad == null}
              aria-label="Unidad"
              className="shrink-0 px-1 py-1.5 text-base sm:text-sm bg-transparent text-gray-700 dark:text-gray-200 outline-none cursor-pointer disabled:text-gray-300 dark:disabled:text-gray-600 disabled:cursor-default"
            >
              {UNIDADES_DESPENSA.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>
        {sugerida && (
          <p className="px-1 mt-1.5 text-[11px] text-orange-600/80 dark:text-orange-400/80">
            Con la cantidad, la lista de la compra resta lo que ya tenéis en casa.
          </p>
        )}
      </div>

      <label className="flex items-center justify-between gap-3 px-4 py-2.5 mb-3 text-sm rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 cursor-pointer">
        Caducidad
        <input
          type="date"
          value={item.caducidad ?? ''}
          onChange={(e) => onEditar({ caducidad: e.target.value || null })}
          className="bg-transparent text-right text-sm text-gray-700 dark:text-gray-200 outline-none cursor-pointer"
        />
      </label>

      <Apertura item={item} onEditar={onEditar} />

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
    </>
  )
}

function Apertura({ item, onEditar }: { item: IngredienteDespensa; onEditar: (c: CambiosIngrediente) => void }) {
  const dias = diasTrasAbrir(item.nombre, item.familia)
  const abierto = item.abierto != null

  return (
    <div
      className={`mb-4 text-sm rounded-xl border transition-colors ${
        abierto
          ? 'border-amber-200 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-900/10'
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      <label className="flex items-center justify-between gap-3 px-4 py-2.5 cursor-pointer">
        <span className="text-gray-500 dark:text-gray-400">Paquete abierto</span>
        <input
          type="checkbox"
          checked={abierto}
          onChange={(e) => onEditar({ abierto: e.target.checked ? sumarDias(0) : null })}
          className="w-4 h-4 accent-amber-500"
          aria-label="Marcar el paquete como abierto"
        />
      </label>

      {abierto && (
        <div className="px-4 pb-3 -mt-0.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-gray-400 dark:text-gray-500">Se abrió el</span>
            <input
              type="date"
              value={item.abierto}
              onChange={(e) => e.target.value && onEditar({ abierto: e.target.value })}
              aria-label="Día en que se abrió"
              className="bg-transparent text-right text-sm text-gray-700 dark:text-gray-200 outline-none cursor-pointer"
            />
          </div>
          <p className="mt-1.5 text-[11px] text-amber-700/80 dark:text-amber-400/80">
            {dias == null
              ? 'Abierto aguanta lo mismo: la caducidad se queda como estaba.'
              : `Abierto aguanta unos ${dias} días, y la caducidad ya lo cuenta.`}
          </p>
        </div>
      )}
    </div>
  )
}

export default FichaIngrediente
