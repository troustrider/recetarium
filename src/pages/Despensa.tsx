import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Plus, AlertTriangle, ChefHat, Carrot, Apple, Beef, Fish, Milk,
  Wheat, Bean, Package, Leaf, CupSoda, ShoppingBasket, Trash2, type LucideIcon,
} from 'lucide-react'
import { useDespensa, type IngredienteDespensa } from '../context/DespensaContext'
import { useListaCompraContext, useCompradosContext, useRecetasContext } from '../context'
import { normalizar } from '../utils/ingredientes'
import { FAMILIAS, mismoIngrediente, estaEnDespensa, porAgotarse, faltantes } from '../utils/despensa'
import TarjetaIngrediente from '../components/despensa/TarjetaIngrediente'
import FichaIngrediente from '../components/despensa/FichaIngrediente'
import AnadirIngrediente from '../components/despensa/AnadirIngrediente'
import useIngredientesConocidos from '../hooks/useIngredientesConocidos'

const ICONO_FAMILIA: Record<string, LucideIcon> = {
  verduras: Carrot, frutas: Apple, carnes: Beef, pescados: Fish, 'lácteos': Milk,
  cereales: Wheat, legumbres: Bean, conservas: Package, especias: Leaf,
  bebidas: CupSoda, otros: ShoppingBasket,
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function Despensa() {
  const { despensa, añadir, quitar, setEstado, setCaducidad, setFamilia, vaciar } = useDespensa()
  const { listaCompra, addExtra } = useListaCompraContext()
  const { comprados } = useCompradosContext()
  const { recetas } = useRecetasContext()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [q, setQ] = useState('')
  const [tab, setTab] = useState('todos')
  const [soloAvisos, setSoloAvisos] = useState(searchParams.get('filtro') === 'aviso')
  const [selNombre, setSelNombre] = useState<string | null>(null)
  const [confirmarVaciar, setConfirmarVaciar] = useState(false)
  const [mostrarAñadir, setMostrarAñadir] = useState(false)

  // La confirmación de vaciado caduca sola si no se remata.
  useEffect(() => {
    if (!confirmarVaciar) return
    const t = setTimeout(() => setConfirmarVaciar(false), 4000)
    return () => clearTimeout(t)
  }, [confirmarVaciar])

  const avisos = porAgotarse(despensa)
  const seleccionado = despensa.find((i) => i.nombre === selNombre) ?? null

  const recetasListas = useMemo(
    () => (despensa.length === 0 ? 0 : recetas.filter((r) => faltantes(r, despensa).length === 0).length),
    [recetas, despensa]
  )

  const familiasPresentes = useMemo(() => {
    const presentes = new Set(despensa.map((i) => i.familia || 'otros'))
    return FAMILIAS.filter((f) => presentes.has(f))
  }, [despensa])

  const visibles = useMemo(() => {
    const nq = normalizar(q)
    return despensa.filter((i) => {
      if (tab !== 'todos' && (i.familia || 'otros') !== tab) return false
      if (soloAvisos && avisos.length > 0 && !avisos.includes(i)) return false
      if (nq && !normalizar(i.nombre).includes(nq)) return false
      return true
    })
  }, [despensa, tab, soloAvisos, q, avisos])

  const porFamilia = useMemo(() => {
    const grupos = new Map<string, IngredienteDespensa[]>()
    for (const item of visibles) {
      const fam = item.familia || 'otros'
      if (!grupos.has(fam)) grupos.set(fam, [])
      grupos.get(fam)!.push(item)
    }
    return grupos
  }, [visibles])

  const ingredientesConocidos = useIngredientesConocidos()

  const sugerencias = useMemo(() => {
    const nq = normalizar(q)
    if (!nq) return []
    return ingredientesConocidos
      .filter((s) => normalizar(s.nombre).includes(nq) && !estaEnDespensa(s.nombre, despensa))
      .slice(0, 5)
  }, [q, ingredientesConocidos, despensa])

  const puedeAñadir = q.trim().length > 1 && !estaEnDespensa(q, despensa)

  const enLista = (nombre: string) => listaCompra.some((i) => mismoIngrediente(i.nombre, nombre))

  // Solo lo marcado como comprado y que aún no esté en la despensa.
  const importables = listaCompra.filter(
    (i) => comprados.has(i.clave) && !estaEnDespensa(i.nombre, despensa)
  )

  function añadirYLimpiar(nombre: string, familia: string) {
    añadir(nombre, familia)
    setQ('')
  }

  function mandarALista(item: IngredienteDespensa) {
    addExtra({ nombre: item.nombre, cantidad: 1, unidad: 'ud', familia: item.familia })
  }

  function importarComprados() {
    for (const ing of importables) añadir(ing.nombre, ing.familia)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Hero editorial — mismo lenguaje que el catálogo */}
      <div className="relative rounded-3xl overflow-hidden" style={{ backgroundColor: '#1c0f02' }}>
        <svg className="absolute inset-0 w-full h-full pointer-events-none select-none" style={{ opacity: 0.13 }} aria-hidden="true">
          <filter id="despensa-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.78" numOctaves="4" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#despensa-grain)" />
        </svg>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_100%_0%,rgba(234,88,12,0.28)_0%,transparent_55%)]" />
        <span
          className="absolute font-display font-black text-white select-none pointer-events-none leading-none"
          style={{ fontSize: '150px', opacity: 0.045, bottom: '-18px', right: '12px' }}
          aria-hidden="true"
        >
          {despensa.length}
        </span>
        <div className="relative z-10 flex items-end justify-between gap-4 px-6 sm:px-8 py-8 sm:py-10">
          <div>
            <p className="text-[11px] font-bold text-orange-400/60 uppercase tracking-[0.22em] mb-2">Vuestra cocina</p>
            <h1 className="font-display text-3xl font-bold text-white leading-tight">Despensa</h1>
            <p className="text-sm text-white/50 mt-1.5">
              {despensa.length === 0
                ? 'Todavía vacía'
                : `${despensa.length} ${despensa.length === 1 ? 'ingrediente' : 'ingredientes'}${avisos.length > 0 ? ` · ${avisos.length} se ${avisos.length === 1 ? 'acaba' : 'acaban'}` : ' · todo en orden'}`}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-end gap-2 shrink-0">
            {importables.length > 0 && (
              <motion.button
                onClick={importarComprados}
                className="px-4 py-2.5 text-xs font-bold bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-2xl transition-colors backdrop-blur-sm"
                whileTap={{ scale: 0.97 }}
                title="Añade a la despensa lo que ya marcasteis como comprado en la lista"
              >
                Importar comprados ({importables.length})
              </motion.button>
            )}
            <motion.button
              onClick={() => setMostrarAñadir(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-2xl transition-colors"
              whileTap={{ scale: 0.97 }}
            >
              <Plus className="w-3.5 h-3.5" />
              Añadir
            </motion.button>
          </div>
        </div>
      </div>

      {/* Buscador único: filtra lo que hay y añade lo que falta */}
      <div className="relative -mt-10 mx-4 sm:mx-6 z-10">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && sugerencias.length > 0) añadirYLimpiar(sugerencias[0].nombre, sugerencias[0].familia)
            else if (e.key === 'Enter' && puedeAñadir) añadirYLimpiar(q, 'otros')
          }}
          placeholder="Busca o añade un ingrediente..."
          className="w-full pl-11 pr-4 py-3 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm outline-none focus:ring-2 focus:ring-orange-400 dark:focus:ring-orange-600 transition-all"
        />
        {(sugerencias.length > 0 || puedeAñadir) && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg overflow-hidden z-20">
            {sugerencias.map((s) => (
              <button
                key={s.nombre}
                onClick={() => añadirYLimpiar(s.nombre, s.familia)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
              >
                <span>{capitalize(s.nombre)}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  {s.familia}
                </span>
              </button>
            ))}
            {puedeAñadir && (
              <button
                onClick={() => añadirYLimpiar(q, 'otros')}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left font-semibold text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors border-t border-gray-100 dark:border-gray-700"
              >
                <Plus className="w-3.5 h-3.5" />
                Añadir «{q.trim().toLowerCase()}» a la despensa
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bento: lo urgente y lo que ya podéis cocinar */}
      {despensa.length > 0 && (
        <div className="flex gap-3">
          {avisos.length > 0 && (
            <motion.button
              onClick={() => { setSoloAvisos((v) => !v); setTab('todos') }}
              className={`flex-1 text-left rounded-2xl p-4 bg-amber-50 dark:bg-amber-900/20 transition-shadow ${
                soloAvisos ? 'ring-2 ring-amber-400 dark:ring-amber-500' : ''
              }`}
              whileTap={{ scale: 0.98 }}
            >
              <p className="flex items-center gap-1.5 font-display text-xl font-bold text-amber-700 dark:text-amber-300">
                {avisos.length}
                <AlertTriangle className="w-4 h-4" />
              </p>
              <p className="text-xs font-bold text-amber-700 dark:text-amber-300 mt-0.5">
                se {avisos.length === 1 ? 'acaba' : 'acaban'}
              </p>
              <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-0.5 line-clamp-1">
                {avisos.map((a) => a.nombre).slice(0, 3).join(', ')}
              </p>
            </motion.button>
          )}
          <motion.button
            onClick={() => navigate('/?disponibles=1')}
            className="flex-1 text-left rounded-2xl p-4 bg-emerald-50 dark:bg-emerald-900/20"
            whileTap={{ scale: 0.98 }}
          >
            <p className="flex items-center gap-1.5 font-display text-xl font-bold text-emerald-700 dark:text-emerald-300">
              {recetasListas}
              <ChefHat className="w-4 h-4" />
            </p>
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
              {recetasListas === 1 ? 'receta lista' : 'recetas listas'}
            </p>
            <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
              con lo que tenéis hoy
            </p>
          </motion.button>
        </div>
      )}

      {/* Pestañas por familia */}
      {familiasPresentes.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mb-1 [scrollbar-width:none]">
          {['todos', ...familiasPresentes].map((f) => {
            const Icono = f === 'todos' ? null : ICONO_FAMILIA[f] ?? ShoppingBasket
            return (
              <button
                key={f}
                onClick={() => setTab(f)}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-colors ${
                  tab === f
                    ? 'bg-orange-500 text-white'
                    : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-orange-300 hover:text-orange-600 dark:hover:text-orange-400'
                }`}
              >
                {Icono && <Icono className="w-3.5 h-3.5" />}
                {f === 'todos' ? 'Todo' : capitalize(f)}
              </button>
            )
          })}
        </div>
      )}

      {/* Cuerpo */}
      {despensa.length === 0 ? (
        <div className="text-center py-14">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
            <ShoppingBasket className="w-7 h-7 text-orange-300 dark:text-orange-700" strokeWidth={1.5} />
          </div>
          <h2 className="font-display text-lg font-bold text-gray-700 dark:text-gray-300 mb-1">Vuestra despensa está vacía</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs mx-auto">
            Escribe arriba para añadir lo que hay en casa, o importa lo comprado desde la lista.
          </p>
        </div>
      ) : visibles.length === 0 ? (
        <p className="text-center py-10 text-sm text-gray-400 dark:text-gray-500">
          Nada por aquí con ese filtro.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {[...porFamilia.entries()].map(([familia, items]) => {
            const Icono = ICONO_FAMILIA[familia] ?? ShoppingBasket
            return (
              <div key={familia}>
                {tab === 'todos' && (
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-3">
                    <Icono className="w-3.5 h-3.5" />
                    {capitalize(familia)}
                  </p>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  <AnimatePresence>
                    {items.map((item) => (
                      <TarjetaIngrediente
                        key={item.nombre}
                        item={item}
                        onClick={() => setSelNombre(item.nombre)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {despensa.length > 0 && (
        <div className="flex justify-center pt-3 border-t border-gray-100 dark:border-gray-800">
          {confirmarVaciar ? (
            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => { vaciar(); setConfirmarVaciar(false) }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              ¿Seguro? Borrar los {despensa.length} ingredientes
            </motion.button>
          ) : (
            <button
              onClick={() => setConfirmarVaciar(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Vaciar despensa
            </button>
          )}
        </div>
      )}

      <AnadirIngrediente abierto={mostrarAñadir} onClose={() => setMostrarAñadir(false)} />

      <FichaIngrediente
        item={seleccionado}
        enLista={seleccionado ? enLista(seleccionado.nombre) : false}
        onEstado={(e) => seleccionado && setEstado(seleccionado.nombre, e)}
        onCaducidad={(c) => seleccionado && setCaducidad(seleccionado.nombre, c)}
        onFamilia={(f) => seleccionado && setFamilia(seleccionado.nombre, f)}
        onALista={() => seleccionado && mandarALista(seleccionado)}
        onQuitar={() => { if (seleccionado) { quitar(seleccionado.nombre); setSelNombre(null) } }}
        onClose={() => setSelNombre(null)}
      />
    </div>
  )
}

export default Despensa
