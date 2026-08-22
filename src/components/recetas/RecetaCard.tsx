import { memo, useRef, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Clock, Check, ShoppingBasket } from 'lucide-react'
import type { RecetaListada } from '../../types/receta'
import { SABOR_BG, recetaVisualLayoutId } from '../../utils/sabores'
import { prefetchDetalleReceta } from '../../utils/prefetch'
import { Link } from 'react-router-dom'

const HOVER_CAPAZ =
  typeof window !== 'undefined' ? window.matchMedia?.('(hover: hover)').matches ?? false : false

const CLASES_TARJETA =
  'bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm shadow-black/5 hover:shadow-xl dark:shadow-none transition-shadow duration-300'

function Tilt({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  function alMover(e: React.PointerEvent<HTMLElement>) {
    const el = ref.current
    if (!el) return
    const r = e.currentTarget.getBoundingClientRect()
    const x = -((e.clientY - r.top) / r.height - 0.5) * 6
    const y = ((e.clientX - r.left) / r.width - 0.5) * 6
    el.style.transform = `perspective(900px) rotateX(${x}deg) rotateY(${y}deg)`
  }

  return (
    <div
      ref={ref}
      className={`${CLASES_TARJETA} transition-transform duration-200 ease-out`}
      onPointerMove={alMover}
      onPointerLeave={() => { if (ref.current) ref.current.style.transform = '' }}
    >
      {children}
    </div>
  )
}

interface Props {
  receta: RecetaListada
  onToggleFavorita: (id: string) => void
  faltan?: number
  onToggleLista?: (receta: RecetaListada) => void
  enLista?: boolean
  index?: number
}

function RecetaCard({ receta, onToggleFavorita, faltan, onToggleLista, enLista, index = 0 }: Props) {
  const { id, nombre, categoria, sabor, tiempoPreparacion, favorita, imagen, proteinas, calorias } = receta

  const reduce = useReducedMotion()
  const Contenedor = HOVER_CAPAZ && !reduce ? Tilt : Plano

  return (
    <motion.article
      className="cursor-pointer group relative"
      onMouseEnter={prefetchDetalleReceta}
      initial={{ opacity: 0, y: reduce ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut', delay: reduce ? 0 : Math.min(index, 8) * 0.04 }}
    >
      <Contenedor>
        {/* Zona visual — origen del morph hacia la cabecera de la ficha */}
        <motion.div layoutId={recetaVisualLayoutId(id)} className="relative h-36 overflow-hidden">
          {imagen ? (
            <img
              src={imagen}
              alt={nombre}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: SABOR_BG[sabor] }}>
              {/* Nombre como watermark tipográfico — identidad única por receta */}
              <span
                className="absolute top-1/2 -translate-y-1/2 left-3 font-display font-black leading-none select-none pointer-events-none whitespace-nowrap"
                style={{ fontSize: '72px', color: 'rgba(255,255,255,0.07)' }}
              >
                {nombre}
              </span>
              {/* Trama de puntos */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              />
            </div>
          )}

          {/* Overlay oscuro al hacer hover cuando hay imagen */}
          {imagen && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-300" />
          )}

          {/* Badge categoría — kicker editorial: chip oscuro, punto naranja, esquinas rectas */}
          {categoria && (
            <span className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/55 backdrop-blur-md text-white/90 text-[10px] font-bold uppercase tracking-widest pl-2 pr-2.5 py-1 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
              {categoria}
            </span>
          )}

          {/* Badge de despensa — estado: color solo cuando es accionable (verde listo, ámbar cerca), neutro si quedan muchos */}
          {faltan != null && (
            <span
              className={`absolute bottom-3 left-3 flex items-center gap-1 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${
                faltan === 0
                  ? 'bg-emerald-500/95 text-white'
                  : faltan <= 2
                    ? 'bg-amber-400/95 text-amber-950'
                    : 'bg-black/45 text-white/85'
              }`}
            >
              {faltan === 0 ? <Check className="w-3 h-3" strokeWidth={3} /> : <ShoppingBasket className="w-3 h-3" strokeWidth={2.5} />}
              {faltan === 0 ? '¡Lo tenéis todo!' : faltan === 1 ? 'Falta 1' : `Faltan ${faltan}`}
            </span>
          )}

          {/* Botón favorito — esquina superior derecha */}
          <motion.button
            onClick={(e) => { e.stopPropagation(); onToggleFavorita(id) }}
            className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-sm transition-colors ${
              favorita
                ? 'bg-red-500 text-white'
                : 'bg-white/90 dark:bg-gray-900/85 text-gray-400 hover:text-red-500'
            }`}
            aria-label={favorita ? 'Quitar de favoritas' : 'Añadir a favoritas'}
            whileTap={{ scale: 0.8 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4"
              fill={favorita ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M11.998 21.5C11.998 21.5 3 15.5 3 9a5 5 0 0 1 8.998-3.002A5 5 0 0 1 21 9c0 6.5-9.002 12.5-9.002 12.5z" />
            </svg>
          </motion.button>
        </motion.div>

        {/* Contenido */}
        <div className="p-4">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base leading-snug line-clamp-2 min-h-[2.75rem] group-hover:text-orange-700 dark:group-hover:text-orange-400 transition-colors">
            <Link
              to={`/recetas/${id}`}
              className="outline-none after:content-[''] after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-orange-400"
            >
              {nombre}
            </Link>
          </h3>
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {tiempoPreparacion} min
            </span>
            {proteinas != null && (
              <span className="text-orange-600 dark:text-orange-400 font-semibold">· {proteinas}g prot</span>
            )}
            {calorias != null && (
              <span className="text-gray-500 dark:text-gray-500">· {calorias} kcal</span>
            )}
          </div>

          {onToggleLista && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-500">Ver receta</span>
              <motion.button
                onClick={(e) => { e.stopPropagation(); onToggleLista(receta) }}
                className={`relative z-10 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  enLista
                    ? 'bg-orange-700 dark:bg-orange-600 text-white'
                    : 'text-orange-700 dark:text-orange-400 border border-gray-300 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-600'
                }`}
                whileTap={{ scale: 0.93 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  {enLista ? (
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  ) : (
                    <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                  )}
                </svg>
                {enLista ? 'En lista' : 'Lista'}
              </motion.button>
            </div>
          )}
        </div>
      </Contenedor>
    </motion.article>
  )
}

function Plano({ children }: { children: ReactNode }) {
  return <div className={CLASES_TARJETA}>{children}</div>
}

export default memo(RecetaCard)
