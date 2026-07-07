import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Check, ShoppingBasket, Plus, Heart } from 'lucide-react'
import type { Receta } from '../../types/receta'
import { LUZ } from '../../utils/sabores'
import { prefetchDetalleReceta } from '../../utils/prefetch'

interface Geo {
  cardW: number
  spread: number
  rot: number
}

function geometria(w: number): Geo {
  if (w >= 620) return { cardW: 158, spread: 78, rot: 6 }
  if (w >= 440) return { cardW: 150, spread: 58, rot: 6 }
  return { cardW: 142, spread: 42, rot: 6 }
}

// Fondo neutro para las cards que no están a un solo ingrediente de poderse cocinar.
// El color por sabor se reserva para señalar "falta 1" — así el color significa algo.
const NEUTRAL_BG = '#15181e'

interface Props {
  recetas: Receta[]
  faltanPorReceta: Map<string, number> | null
  titulo: string
  onOpen: (id: string) => void
  onToggleFavorita: (id: string) => void
  onNueva: () => void
}

function AbanicoRecetas({ recetas, faltanPorReceta, titulo, onOpen, onToggleFavorita, onNueva }: Props) {
  const [activeRaw, setActive] = useState(() => Math.floor(recetas.length / 2))
  const [w, setW] = useState(680)
  const ref = useRef<HTMLDivElement>(null)
  const rectRef = useRef<{ left: number; width: number } | null>(null)
  const dragStart = useRef<number | null>(null)
  const hoverCapable = useRef(
    typeof window !== 'undefined' ? window.matchMedia?.('(hover: hover)').matches ?? true : true
  )

  // Índice efectivo, clampado por si la lista cambia de tamaño
  const active = Math.min(activeRaw, Math.max(0, recetas.length - 1))

  function medirRect() {
    const el = ref.current
    if (el) {
      const r = el.getBoundingClientRect()
      rectRef.current = { left: r.left, width: r.width }
    }
  }

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setW(entry.contentRect.width)
      medirRect()
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { cardW, spread, rot } = geometria(w)
  const centerIndex = (recetas.length - 1) / 2

  function mover(delta: number) {
    setActive((a) => Math.max(0, Math.min(recetas.length - 1, a + delta)))
  }

  // Selección por posición del cursor: barrer el ratón elige la card de esa zona,
  // aunque esté parcialmente tapada por sus vecinas.
  function onPointerMove(e: React.PointerEvent) {
    if (!hoverCapable.current) return
    let rect = rectRef.current
    if (!rect) { medirRect(); rect = rectRef.current }
    if (!rect) return
    const cx = e.clientX - (rect.left + rect.width / 2)
    const idx = Math.max(0, Math.min(recetas.length - 1, Math.round(cx / spread + centerIndex)))
    if (idx !== active) setActive(idx)
  }

  function onPointerDown(e: React.PointerEvent) {
    dragStart.current = e.clientX
  }
  function onPointerUp(e: React.PointerEvent) {
    if (dragStart.current == null) return
    const dx = e.clientX - dragStart.current
    dragStart.current = null
    if (!hoverCapable.current && Math.abs(dx) > 40) mover(dx < 0 ? 1 : -1)
  }

  return (
    <section aria-label="Recetas destacadas de hoy" className="flex flex-col gap-2">
      <div className="flex items-end justify-between gap-4 px-1">
        <div>
          <p className="text-[11px] font-bold text-orange-500 dark:text-orange-400 uppercase tracking-[0.2em] mb-1">Tu recetario</p>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">{titulo}</h1>
        </div>
        <motion.button
          onClick={onNueva}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-orange-700 dark:bg-orange-600 text-white rounded-xl hover:bg-orange-800 dark:hover:bg-orange-700 transition-colors shrink-0"
          whileTap={{ scale: 0.96 }}
        >
          <Plus className="w-4 h-4" strokeWidth={2.4} />
          Nueva
        </motion.button>
      </div>

      <div
        ref={ref}
        role="listbox"
        aria-label="Abanico de recetas"
        tabIndex={0}
        onPointerEnter={medirRect}
        onPointerMove={onPointerMove}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') { mover(1); e.preventDefault() }
          if (e.key === 'ArrowLeft') { mover(-1); e.preventDefault() }
          if (e.key === 'Enter') onOpen(recetas[active].id)
        }}
        className="relative h-[316px] select-none outline-none touch-pan-y"
        style={{ perspective: 1300 }}
      >
        {recetas.map((receta, i) => {
          const luz = LUZ[receta.sabor]
          const faltan = faltanPorReceta?.get(receta.id)
          const conColor = faltan === 1  // color por sabor solo cuando falta 1 ingrediente
          const bg = conColor ? luz.bg : NEUTRAL_BG
          const bloom = conColor ? luz.bloom : 'transparent'
          // Halo en el color del sabor: señal inequívoca de "a un ingrediente" que
          // sobrevive al atenuado de las laterales. Las neutras no lo llevan.
          const glow = conColor ? `0 0 0 1px ${luz.dot}66, 0 0 20px -2px ${luz.dot}55` : ''
          const slot = i - centerIndex   // posición fija en el abanico
          const d = i - active           // distancia a la card activa (solo estética)
          const ad = Math.abs(d)
          const isA = i === active
          const x = slot * spread
          const y = isA ? -20 : 0        // las laterales no bajan → no tapan los filtros
          const rotate = isA ? 0 : slot * rot
          const scale = isA ? 1.14 : Math.max(0.85, 1 - ad * 0.045)

          return (
            <motion.div
              key={receta.id}
              role="option"
              aria-selected={isA}
              aria-label={receta.nombre}
              onClick={() => onOpen(receta.id)}
              onMouseEnter={prefetchDetalleReceta}
              className="absolute left-1/2 bottom-2 rounded-2xl overflow-hidden cursor-pointer"
              style={{
                width: cardW,
                height: 250,
                marginLeft: -cardW / 2,
                backgroundColor: bg,
                transformOrigin: 'bottom center',
                zIndex: isA ? 100 : 50 - ad,
                boxShadow: [isA && '0 18px 44px rgba(0,0,0,0.45)', glow].filter(Boolean).join(', ') || 'none',
                outline: isA ? '1.5px solid rgba(251,146,60,0.55)' : 'none',
              }}
              animate={{ x, y, rotate, scale }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              whileTap={{ scale: isA ? 1.1 : scale }}
            >
              {/* Foto de la receta si la tiene; si no, watermark tipográfico */}
              {receta.imagen ? (
                <img
                  src={receta.imagen}
                  alt={receta.nombre}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  draggable={false}
                />
              ) : (
                <>
                  {/* Bloom del sabor */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: `radial-gradient(ellipse 120% 85% at 80% -8%, ${bloom} 0%, transparent 68%)` }}
                  />
                  {/* Trama de puntos */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
                      backgroundSize: '18px 18px',
                    }}
                  />
                  {/* Watermark tipográfico */}
                  <span
                    className="absolute top-7 -left-0.5 font-display font-black leading-none whitespace-nowrap pointer-events-none"
                    style={{ fontSize: '52px', color: 'rgba(255,255,255,0.14)' }}
                  >
                    {receta.nombre.split(' ')[0]}
                  </span>
                </>
              )}
              {/* Scrim inferior */}
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(6,8,10,0.9) 100%)' }} />

              {/* Badge estado despensa */}
              {faltan != null && (
                <span
                  className={`absolute top-2.5 left-2.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${
                    faltan === 0
                      ? 'bg-emerald-500/95 text-white'
                      : faltan <= 2
                        ? 'bg-amber-400/95 text-amber-950'
                        : 'bg-black/45 text-white/85'
                  }`}
                >
                  {faltan === 0 ? <Check className="w-3 h-3" strokeWidth={3} /> : <ShoppingBasket className="w-3 h-3" strokeWidth={2.5} />}
                  {faltan === 0 ? '¡Todo!' : faltan === 1 ? 'Falta 1' : `Faltan ${faltan}`}
                </span>
              )}

              {/* Favorito */}
              <button
                onClick={(e) => { e.stopPropagation(); onToggleFavorita(receta.id) }}
                className={`absolute top-2.5 right-2.5 p-1.5 rounded-full transition-colors ${
                  receta.favorita ? 'bg-red-500 text-white' : 'bg-black/30 text-white/75 hover:text-red-400'
                }`}
                aria-label={receta.favorita ? 'Quitar de favoritas' : 'Añadir a favoritas'}
              >
                <Heart className="w-3.5 h-3.5" fill={receta.favorita ? 'currentColor' : 'none'} strokeWidth={2} />
              </button>

              {/* Contenido */}
              <div className="absolute left-3 right-3 bottom-3">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                  {receta.categoria}
                </p>
                <p className="font-display font-bold text-[15px] leading-tight text-[#FBF7F0] line-clamp-2">{receta.nombre}</p>
                <p className="mt-1.5 flex items-center gap-1 text-[11px] text-white/60">
                  <Clock className="w-3 h-3" />
                  {receta.tiempoPreparacion} min
                  {receta.proteinas != null && <span className="text-orange-300 font-semibold">· {receta.proteinas}g</span>}
                </p>
              </div>

              {/* Atenuado si no está activa — foco cinematográfico */}
              <motion.div
                className="absolute inset-0 pointer-events-none bg-[#05070a]"
                animate={{ opacity: isA ? 0 : Math.min(0.55, 0.2 + ad * 0.08) }}
                transition={{ duration: 0.35 }}
              />
            </motion.div>
          )
        })}
      </div>

      {/* Puntos de navegación */}
      <div className="flex items-center justify-center gap-1.5">
        {recetas.map((r, i) => (
          <button
            key={r.id}
            onClick={() => setActive(i)}
            className={`h-1.5 rounded-full transition-all ${i === active ? 'w-5 bg-orange-500' : 'w-1.5 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400'}`}
            aria-label={`Ir a ${r.nombre}`}
          />
        ))}
      </div>
    </section>
  )
}

export default AbanicoRecetas
