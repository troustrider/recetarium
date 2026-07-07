import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, Pause, RotateCcw, ChevronLeft, ChevronRight, ListChecks, Timer as TimerIcon } from 'lucide-react'
import type { Receta } from '../../types/receta'
import { LUZ, SABOR_BG } from '../../utils/sabores'
import { parseDuraciones, formatReloj } from '../../utils/parseDuracion'
import { formatCantidad, canonUnidad } from '../../utils/ingredientes'
import { useWakeLock } from '../../hooks/useWakeLock'
import { useTimers, type Timer } from '../../hooks/useTimers'

interface Props {
  receta: Receta
  multiplicador: number
  onClose: () => void
}

function ModoCocina({ receta, multiplicador, onClose }: Props) {
  const [paso, setPaso] = useState(0)
  const [ingredientesOpen, setIngredientesOpen] = useState(false)
  const { timers, toggle, eliminar } = useTimers()
  const luz = LUZ[receta.sabor]

  useWakeLock(true)

  // Bloquea el scroll de fondo mientras el modo ocupa la pantalla.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const total = receta.pasos.length
  const esUltimo = paso === total - 1
  const duraciones = useMemo(() => parseDuraciones(receta.pasos[paso] ?? ''), [receta.pasos, paso])
  const activos = timers.filter((t) => t.corriendo && !t.hecho).length

  function intentarCerrar() {
    if (activos > 0 && !window.confirm(`Tienes ${activos} temporizador${activos > 1 ? 'es' : ''} en marcha. ¿Salir del modo cocina?`)) return
    onClose()
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') intentarCerrar()
      if (e.key === 'ArrowRight' && !esUltimo) setPaso((p) => p + 1)
      if (e.key === 'ArrowLeft' && paso > 0) setPaso((p) => p - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex flex-col text-white overflow-hidden"
      style={{ backgroundColor: SABOR_BG[receta.sabor] }}
      initial={{ opacity: 0, scale: 1.02 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Bloom del color de sabor — misma identidad que el hero */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(120% 60% at 50% 0%, ${luz.bloom}, transparent 70%)` }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.5]"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '22px 22px' }}
      />

      {/* Cabecera */}
      <header className="relative flex items-start justify-between gap-3 px-5 pb-3" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/50 flex items-center gap-1.5">
            <TimerIcon className="w-3 h-3" /> Modo cocina
          </p>
          <h2 className="font-display text-xl font-bold leading-tight truncate">{receta.nombre}</h2>
        </div>
        <button
          onClick={intentarCerrar}
          className="shrink-0 p-2 -mr-1 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Salir del modo cocina"
        >
          <X className="w-6 h-6" />
        </button>
      </header>

      {/* Progreso por pasos */}
      <div className="relative px-5 flex gap-1.5">
        {receta.pasos.map((_, i) => (
          <button
            key={i}
            onClick={() => setPaso(i)}
            className="flex-1 h-1.5 rounded-full transition-colors"
            style={{ backgroundColor: i <= paso ? luz.dot : 'rgba(255,255,255,0.15)' }}
            aria-label={`Ir al paso ${i + 1}`}
          />
        ))}
      </div>

      {/* Paso actual */}
      <div className="relative flex-1 overflow-y-auto px-6 flex flex-col justify-center min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={paso}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-4" style={{ color: luz.dot }}>
              Paso {paso + 1} <span className="text-white/40">/ {total}</span>
            </p>
            <p className="font-display text-[1.7rem] leading-snug font-medium text-white/95">
              {receta.pasos[paso]}
            </p>

            {duraciones.length > 0 && (
              <div className="mt-7 flex flex-wrap gap-2.5">
                {duraciones.map((d, idx) => {
                  const id = `${paso}-${idx}`
                  const timer = timers.find((t) => t.id === id)
                  return (
                    <ChipTemporizador
                      key={id}
                      etiqueta={d.etiqueta}
                      dotColor={luz.dot}
                      timer={timer}
                      onToggle={() => toggle({ id, etiqueta: d.etiqueta, stepIndex: paso, segundos: d.segundos })}
                    />
                  )
                })}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bandeja de temporizadores activos (de cualquier paso) */}
      <AnimatePresence>
        {timers.length > 0 && (
          <motion.div
            className="relative px-5 pb-1"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
          >
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              {timers.map((t) => (
                <BandejaTimer
                  key={t.id}
                  timer={t}
                  dotColor={luz.dot}
                  activo={t.stepIndex === paso}
                  onTap={() => toggle({ id: t.id, etiqueta: t.etiqueta, stepIndex: t.stepIndex, segundos: t.total })}
                  onIr={() => setPaso(t.stepIndex)}
                  onEliminar={() => eliminar(t.id)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controles */}
      <footer className="relative px-5 pt-2 pb-[calc(env(safe-area-inset-bottom)+1rem)] flex items-center gap-3 border-t border-white/10">
        <button
          onClick={() => setIngredientesOpen(true)}
          className="shrink-0 flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-2xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Ver ingredientes"
        >
          <ListChecks className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Ingr.</span>
        </button>

        <button
          onClick={() => setPaso((p) => Math.max(0, p - 1))}
          disabled={paso === 0}
          className="shrink-0 w-12 h-12 flex items-center justify-center rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-25"
          aria-label="Paso anterior"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {esUltimo ? (
          <button
            onClick={intentarCerrar}
            className="flex-1 h-12 flex items-center justify-center rounded-2xl font-bold text-gray-900 transition-transform active:scale-[0.98]"
            style={{ backgroundColor: luz.dot }}
          >
            Terminar
          </button>
        ) : (
          <button
            onClick={() => setPaso((p) => Math.min(total - 1, p + 1))}
            className="flex-1 h-12 flex items-center justify-center gap-2 rounded-2xl font-bold text-gray-900 transition-transform active:scale-[0.98]"
            style={{ backgroundColor: luz.dot }}
          >
            Siguiente <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </footer>

      {/* Hoja de ingredientes */}
      <AnimatePresence>
        {ingredientesOpen && (
          <>
            <motion.div
              className="absolute inset-0 z-10 bg-black/50"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIngredientesOpen(false)}
            />
            <motion.div
              className="absolute inset-x-0 bottom-0 z-20 max-h-[70%] rounded-t-3xl bg-gray-900 border-t border-white/10 flex flex-col"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            >
              <div className="flex items-center justify-between px-6 pt-5 pb-3">
                <h3 className="font-display text-lg font-bold">Ingredientes</h3>
                <button onClick={() => setIngredientesOpen(false)} className="p-2 -mr-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10" aria-label="Cerrar ingredientes">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ul className="overflow-y-auto px-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] flex flex-col">
                {receta.ingredientes.map((ing, i) => (
                  <li key={i} className="flex items-baseline gap-2 py-2.5 border-b border-white/5 last:border-0">
                    <span className="font-semibold text-white/90">{ing.nombre.charAt(0).toUpperCase() + ing.nombre.slice(1)}</span>
                    <span className="flex-1 border-b border-dotted border-white/15 translate-y-[-3px]" />
                    <span className="text-sm font-bold tabular-nums shrink-0" style={{ color: luz.dot }}>
                      {formatCantidad(ing.cantidad * multiplicador, canonUnidad(ing.nombre, ing.unidad))}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function ChipTemporizador({ etiqueta, dotColor, timer, onToggle }: {
  etiqueta: string
  dotColor: string
  timer?: Timer
  onToggle: () => void
}) {
  const hecho = timer?.hecho
  const corriendo = timer?.corriendo

  return (
    <motion.button
      onClick={onToggle}
      whileTap={{ scale: 0.95 }}
      className="flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-2xl font-bold text-sm transition-colors"
      style={
        hecho
          ? { backgroundColor: 'rgba(251,191,36,0.2)', color: '#fbbf24' }
          : corriendo
            ? { backgroundColor: dotColor, color: '#0b0b0b' }
            : { backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' }
      }
    >
      {hecho ? <RotateCcw className="w-4 h-4" /> : corriendo ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      <span className="tabular-nums">
        {hecho ? '¡Listo!' : timer ? formatReloj(timer.restante) : etiqueta}
      </span>
    </motion.button>
  )
}

function BandejaTimer({ timer, dotColor, activo, onTap, onIr, onEliminar }: {
  timer: Timer
  dotColor: string
  activo: boolean
  onTap: () => void
  onIr: () => void
  onEliminar: () => void
}) {
  return (
    <div
      className="shrink-0 flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl border"
      style={{
        borderColor: activo ? dotColor : 'rgba(255,255,255,0.12)',
        backgroundColor: timer.hecho ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.06)',
      }}
    >
      <button onClick={onIr} className="text-[10px] font-bold uppercase tracking-wider text-white/50 hover:text-white/80" aria-label={`Ir al paso ${timer.stepIndex + 1}`}>
        P{timer.stepIndex + 1}
      </button>
      <button onClick={onTap} className="flex items-center gap-1.5" aria-label="Play/pausa temporizador">
        {timer.hecho
          ? <RotateCcw className="w-3.5 h-3.5" style={{ color: '#fbbf24' }} />
          : timer.corriendo
            ? <Pause className="w-3.5 h-3.5 text-white/80" />
            : <Play className="w-3.5 h-3.5 text-white/80" />}
        <span className="text-sm font-bold tabular-nums" style={{ color: timer.hecho ? '#fbbf24' : '#fff' }}>
          {timer.hecho ? '¡Listo!' : formatReloj(timer.restante)}
        </span>
      </button>
      <button onClick={onEliminar} className="p-1 rounded-lg text-white/30 hover:text-white/70" aria-label="Quitar temporizador">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export default ModoCocina
