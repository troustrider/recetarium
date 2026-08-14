import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Flame, Lightbulb, Scale, Salad, ShoppingCart } from 'lucide-react'
import { useRecetasContext, useDeshacer } from '../context'
import { useListaCompraContext } from '../context'
import useReceta from '../hooks/useReceta'
import IngredienteItem from '../components/recetas/IngredienteItem'
import FichaMicros from '../components/recetas/FichaMicros'
import { escalarPasos, tieneCantidadesEscalables } from '../utils/escalarPasos'
import ModoCocina from '../components/cocina/ModoCocina'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import ErrorMessage from '../components/shared/ErrorMessage'
import { SABOR_BG, recetaVisualLayoutId } from '../utils/sabores'

const PORCIONES_POR_DEFECTO = 2

function formatMultiplicador(m: number) {
  return String(+m.toFixed(2)).replace('.', ',')
}

function BotonFavorita({ favorita, onClick, className }: {
  favorita: boolean
  onClick: () => void
  className: string
}) {
  return (
    <motion.button
      onClick={onClick}
      className={`${className} p-2 rounded-full backdrop-blur-sm transition-colors ${favorita ? 'bg-red-500 text-white' : 'bg-white/10 text-white/50 hover:bg-white/20 hover:text-white'}`}
      aria-label={favorita ? 'Quitar de favoritas' : 'Añadir a favoritas'}
      whileTap={{ scale: 0.85 }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5"
        fill={favorita ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M11.998 21.5C11.998 21.5 3 15.5 3 9a5 5 0 0 1 8.998-3.002A5 5 0 0 1 21 9c0 6.5-9.002 12.5-9.002 12.5z" />
      </svg>
    </motion.button>
  )
}

function SkeletonLineas({ filas }: { filas: number }) {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      {Array.from({ length: filas }).map((_, i) => (
        <div key={i} className="h-4 rounded bg-gray-100 dark:bg-gray-800" style={{ width: `${90 - i * 8}%` }} />
      ))}
    </div>
  )
}

function DetalleReceta() {
  const { id } = useParams<{ id: string }>()
  const { recetas, eliminar, restaurar, toggleFavorita, ultimaEdicion, deshacer, descartarDeshacer } = useRecetasContext()
  const { registrar } = useDeshacer()
  const { toggleReceta, setRaciones, estaSeleccionada } = useListaCompraContext()
  const { receta: fetched, error, recargar } = useReceta(id!)
  const registradaRef = useRef<typeof ultimaEdicion>(null)
  const navigate = useNavigate()
  const [comensales, setComensales] = useState(PORCIONES_POR_DEFECTO)
  const [cocinaOpen, setCocinaOpen] = useState(false)

  const cached = useMemo(() => recetas.find((r) => r.id === id) ?? null, [recetas, id])
  const receta = fetched ?? cached
  const full = fetched ?? (cached && cached.ingredientes.length > 0 ? cached : null)
  const detalleListo = !!full

  const ingredientesPorFamilia = useMemo(() => {
    if (!full) return []
    const mapa = new Map<string, typeof full.ingredientes>()
    for (const ing of full.ingredientes) {
      const familia = ing.familia || 'Otros'
      if (!mapa.has(familia)) mapa.set(familia, [])
      mapa.get(familia)!.push(ing)
    }
    return [...mapa.entries()]
  }, [full])

  useEffect(() => {
    if (!ultimaEdicion || ultimaEdicion.id !== id) return
    if (registradaRef.current === ultimaEdicion) return
    registradaRef.current = ultimaEdicion
    registrar(
      'Receta editada',
      () => { void deshacer().then((ok) => { if (ok) recargar() }) },
      descartarDeshacer
    )
  }, [ultimaEdicion, id, registrar, deshacer, recargar, descartarDeshacer])

  if (!receta) {
    if (error) return <ErrorMessage message={error} />
    return <LoadingSpinner />
  }

  async function handleEliminar() {
    const { id: borradaId, nombre } = receta!
    const ok = await eliminar(borradaId)
    if (!ok) return
    navigate('/')
    registrar(`Borrada ${nombre}`, () => { void restaurar(borradaId) })
  }

  const porcionesBase = receta.porciones ?? PORCIONES_POR_DEFECTO
  const multiplicador = comensales / porcionesBase
  const enLista = estaSeleccionada(receta.id)

  function alternarLista(completa: NonNullable<typeof full>) {
    toggleReceta(completa)
    if (!enLista) setRaciones(completa.id, comensales)
  }
  const pasosEscalan = tieneCantidadesEscalables(fetched?.pasos ?? [])

  return (
    <div className="flex flex-col gap-8">

      {/* Header con imagen opcional */}
      {receta.imagen ? (
        <motion.div layoutId={recetaVisualLayoutId(receta.id)} className="relative h-56 rounded-2xl overflow-hidden">
          <img
            src={receta.imagen}
            alt={receta.nombre}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <BotonFavorita
            favorita={receta.favorita}
            onClick={() => toggleFavorita(receta.id)}
            className="absolute top-4 right-4"
          />
          <div className="absolute bottom-4 left-5 right-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60 mb-1">
              {[receta.categoria, receta.sabor, `${receta.tiempoPreparacion} min`].filter(Boolean).join(' / ')}
            </p>
            <h1 className="font-display text-3xl font-bold text-white leading-tight">{receta.nombre}</h1>
          </div>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Header visual sin imagen — destino del morph desde la card */}
          <motion.div layoutId={recetaVisualLayoutId(receta.id)} className="relative h-44 rounded-2xl overflow-hidden" style={{ backgroundColor: SABOR_BG[receta.sabor] }}>
            <span
              className="absolute top-1/2 -translate-y-1/2 left-5 font-display font-black leading-none select-none pointer-events-none whitespace-nowrap"
              style={{ fontSize: '96px', color: 'rgba(255,255,255,0.06)' }}
            >
              {receta.nombre}
            </span>
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />
            <BotonFavorita
              favorita={receta.favorita}
              onClick={() => toggleFavorita(receta.id)}
              className="absolute top-4 right-4"
            />
          </motion.div>
          {/* Metadatos + título */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-1">
              {[receta.categoria, receta.sabor, `${receta.tiempoPreparacion} min`].filter(Boolean).join(' / ')}
            </p>
            <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
              {receta.nombre}
            </h1>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <motion.button
          onClick={() => navigate(`/recetas/${receta.id}/editar`)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-white transition-colors"
          whileTap={{ scale: 0.97 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
          </svg>
          Editar
        </motion.button>
        <motion.button
          onClick={handleEliminar}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-red-300 dark:hover:border-red-700 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          whileTap={{ scale: 0.97 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
          </svg>
          Eliminar
        </motion.button>
      </div>

      {fetched && fetched.pasos.length > 0 && (
        <motion.button
          onClick={() => setCocinaOpen(true)}
          className="flex items-center justify-center gap-2.5 w-full py-3.5 text-sm font-bold text-white rounded-2xl bg-gradient-to-br from-orange-600 to-amber-500 shadow-sm shadow-orange-500/20"
          whileTap={{ scale: 0.98 }}
        >
          <Flame className="w-5 h-5" strokeWidth={2.2} />
          Modo cocina
        </motion.button>
      )}

      {receta.calorias != null && (
        <div className="grid grid-cols-4 gap-2">
          {([
            ['Kcal', receta.calorias, ''],
            ['Prot', receta.proteinas, 'g'],
            ['Carb', receta.carbohidratos, 'g'],
            ['Grasa', receta.grasas, 'g'],
          ] as const).map(([label, valor, unidad]) => (
            <div key={label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 px-2 py-3 text-center">
              <p className="font-display text-lg font-bold text-gray-900 dark:text-gray-100 tabular-nums leading-none">
                {valor ?? '—'}{unidad}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mt-1">
                {label}
              </p>
            </div>
          ))}
          {receta.micros && (
            <div className="col-span-4 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] text-gray-500 dark:text-gray-400 tabular-nums">
              <span>Fibra {receta.micros.fibra}g</span>
              <span>Azúcares {receta.micros.azucares}g</span>
              <span>Saturadas {receta.micros.saturadas}g</span>
              <span>Sal {String(receta.micros.sal).replace('.', ',')}g</span>
            </div>
          )}
          <p className="col-span-4 text-[10px] text-gray-400 dark:text-gray-500 text-center -mt-1">por porción</p>
        </div>
      )}

      <FichaMicros receta={receta} />

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-gray-800 dark:text-gray-100">Ingredientes</h2>
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-1.5">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mr-1">Personas</span>
            <motion.button
              onClick={() => setComensales((c) => Math.max(1, c - 1))}
              className="w-6 h-6 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 font-bold text-lg leading-none disabled:opacity-30"
              disabled={comensales <= 1}
              whileTap={{ scale: 0.85 }}
              aria-label="Reducir comensales"
            >
              −
            </motion.button>
            <span className="w-5 text-center text-sm font-bold text-gray-800 dark:text-gray-200 tabular-nums">
              {comensales}
            </span>
            <motion.button
              onClick={() => setComensales((c) => Math.min(12, c + 1))}
              className="w-6 h-6 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 font-bold text-lg leading-none disabled:opacity-30"
              disabled={comensales >= 12}
              whileTap={{ scale: 0.85 }}
              aria-label="Aumentar comensales"
            >
              +
            </motion.button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex flex-col gap-4">
          {detalleListo ? (
            ingredientesPorFamilia.map(([familia, ingredientes]) => (
              <div key={familia}>
                {ingredientesPorFamilia.length > 1 && (
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-2">
                    {familia}
                  </p>
                )}
                <ul className="flex flex-col">
                  {ingredientes.map((ing, i) => (
                    <IngredienteItem key={i} ingrediente={ing} multiplicador={multiplicador} />
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <SkeletonLineas filas={5} />
          )}

          {full && (
            <motion.button
              onClick={() => alternarLista(full)}
              className={`flex items-center justify-center gap-2 w-full mt-1 py-3 text-sm font-bold rounded-xl border transition-colors ${
                enLista
                  ? 'bg-orange-700 dark:bg-orange-600 border-transparent text-white'
                  : 'border-gray-200 dark:border-gray-700 text-orange-700 dark:text-orange-400 hover:border-orange-500 dark:hover:border-orange-600'
              }`}
              whileTap={{ scale: 0.98 }}
            >
              {enLista ? <Check className="w-4 h-4" strokeWidth={2.6} /> : <ShoppingCart className="w-4 h-4" strokeWidth={2.2} />}
              {enLista
                ? 'En la lista de la compra'
                : `Añadir a la lista · ${comensales} ${comensales === 1 ? 'persona' : 'personas'}`}
            </motion.button>
          )}
        </div>
      </section>

      {/* Guarnición. Va en su propio bloque y con su ficha aparte porque es
          opcional: las kcal y el gluten de arriba son los del plato solo. */}
      {full?.guarnicion && (
        <section className="bg-lime-50/60 dark:bg-lime-900/10 border border-lime-100 dark:border-lime-900/30 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Salad className="w-4 h-4 text-lime-600 dark:text-lime-400" strokeWidth={2.2} />
            <h2 className="font-display text-lg font-bold text-gray-800 dark:text-gray-100">
              {full.guarnicion.nombre}
            </h2>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Guarnición opcional. No está contada en los valores de arriba.
          </p>

          <ul className="flex flex-col mb-4">
            {full.guarnicion.ingredientes.map((ing, i) => (
              <IngredienteItem key={i} ingrediente={ing} multiplicador={multiplicador} />
            ))}
          </ul>

          {fetched?.guarnicion && fetched.guarnicion.pasos.length > 0 && (
            <ol className="flex flex-col gap-2 mb-4">
              {escalarPasos(fetched.guarnicion.pasos, multiplicador).map((paso, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="shrink-0 w-5 h-5 flex items-center justify-center bg-lime-600 text-white rounded-full text-[10px] font-bold">
                    {i + 1}
                  </span>
                  <span className="text-gray-700 dark:text-gray-300 leading-relaxed">{paso}</span>
                </li>
              ))}
            </ol>
          )}

          {full.guarnicion.calorias != null && (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Añade <strong className="text-gray-900 dark:text-gray-100">{full.guarnicion.calorias} kcal</strong> por ración
              {full.guarnicion.proteinas != null && <> y {full.guarnicion.proteinas} g de proteína</>}
              {full.guarnicion.sinGluten === false && (
                <span className="text-amber-600 dark:text-amber-400"> · lleva gluten</span>
              )}
            </p>
          )}
        </section>
      )}

      <section>
        <h2 className="font-display text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Pasos</h2>
        {multiplicador !== 1 && !pasosEscalan && (
          <p className="flex items-start gap-2.5 mb-4 text-sm bg-amber-50 dark:bg-amber-900/15 border border-amber-100 dark:border-amber-900/30 rounded-2xl px-4 py-3 text-gray-700 dark:text-gray-300 leading-relaxed">
            <Scale className="shrink-0 w-4 h-4 mt-0.5 text-amber-500 dark:text-amber-400" strokeWidth={2.2} />
            <span>
              Los ingredientes están ajustados a {comensales} comensales, pero las cantidades
              que aparecen en los pasos son las de la receta base para {porcionesBase}.
              Multiplícalas por {formatMultiplicador(multiplicador)}.
            </span>
          </p>
        )}
        {fetched ? (
          <ol className="flex flex-col gap-4">
            {escalarPasos(fetched.pasos, multiplicador).map((paso, i) => (
              <li key={i} className="flex items-start gap-4 text-sm">
                <span className="shrink-0 w-7 h-7 flex items-center justify-center bg-gradient-to-br from-orange-700 to-amber-600 text-white rounded-full text-xs font-bold shadow-sm">
                  {i + 1}
                </span>
                <span className="text-gray-700 dark:text-gray-300 leading-relaxed pt-1">{paso}</span>
              </li>
            ))}
          </ol>
        ) : (
          <SkeletonLineas filas={4} />
        )}
      </section>

      {fetched?.consejos && fetched.consejos.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Consejos del chef</h2>
          <ul className="flex flex-col gap-3">
            {fetched.consejos.map((consejo, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-sm bg-amber-50 dark:bg-amber-900/15 border border-amber-100 dark:border-amber-900/30 rounded-2xl px-4 py-3"
              >
                <Lightbulb className="shrink-0 w-4 h-4 mt-0.5 text-amber-500 dark:text-amber-400" strokeWidth={2.2} />
                <span className="text-gray-700 dark:text-gray-300 leading-relaxed">{consejo}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <AnimatePresence>
        {cocinaOpen && fetched && (
          <ModoCocina receta={fetched} multiplicador={multiplicador} onClose={() => setCocinaOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

export default DetalleReceta
