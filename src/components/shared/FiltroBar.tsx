import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SlidersHorizontal, X } from 'lucide-react'
import type { Sabor } from '../../types/receta'
import type { Filtros } from '../../hooks/useFiltros'

// Gradientes idénticos a los de las recipe cards — el panel "muestra" el sabor
const SABORES: { valor: Sabor; label: string; gradient: string; dot: string }[] = [
  { valor: 'salado', label: 'Salado',  gradient: 'linear-gradient(135deg,#041524 0%,#0c3553 55%,#1e6fa1 100%)', dot: '#38bdf8' },
  { valor: 'dulce',  label: 'Dulce',   gradient: 'linear-gradient(135deg,#2d0412 0%,#7f1d45 55%,#e11d60 100%)', dot: '#fb7185' },
  { valor: 'amargo', label: 'Amargo',  gradient: 'linear-gradient(135deg,#180d00 0%,#3d2200 55%,#b45309 100%)', dot: '#fb923c' },
  { valor: 'umami',  label: 'Umami',   gradient: 'linear-gradient(135deg,#100820 0%,#2e1065 55%,#7c3aed 100%)', dot: '#a78bfa' },
  { valor: 'acido',  label: 'Ácido',   gradient: 'linear-gradient(135deg,#0c1a00 0%,#2a4a00 55%,#65a30d 100%)', dot: '#a3e635' },
]
const NEUTRAL_BG = 'linear-gradient(135deg,#111827 0%,#1f2937 55%,#374151 100%)'

const TIEMPOS: { valor: 15 | 30 | 60 | ''; label: string }[] = [
  { valor: '',  label: 'Todo' },
  { valor: 15,  label: '15 min' },
  { valor: 30,  label: '30 min' },
  { valor: 60,  label: '60 min' },
]

interface Props {
  filtros: Filtros
  categorias: string[]
  onChange: (filtros: Filtros) => void
}

function FiltroBar({ filtros, categorias, onChange }: Props) {
  const [open, setOpen] = useState(false)

  const activeCount = [filtros.categoria !== '', filtros.sabor !== '', filtros.tiempoMax !== ''].filter(Boolean).length
  const saborActivo = SABORES.find((s) => s.valor === filtros.sabor)
  const panelBg = saborActivo?.gradient ?? NEUTRAL_BG

  return (
    <div className="relative">
      {/* Trigger + chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            open || activeCount > 0
              ? 'bg-orange-500 text-white shadow-sm shadow-orange-400/30 dark:shadow-orange-900/40'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={2.2} />
          Filtrar
          {activeCount > 0 && (
            <span className="w-5 h-5 flex items-center justify-center bg-white/30 rounded-full text-[11px] font-bold leading-none">
              {activeCount}
            </span>
          )}
        </button>

        <AnimatePresence mode="popLayout">
          {filtros.categoria && (
            <motion.button key="c" type="button" onClick={() => onChange({ ...filtros, categoria: '' })}
              className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-semibold rounded-full capitalize"
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.1 }}>
              {filtros.categoria}<X className="w-3 h-3 ml-0.5" />
            </motion.button>
          )}
          {saborActivo && (
            <motion.button key="s" type="button" onClick={() => onChange({ ...filtros, sabor: '' })}
              className="flex items-center gap-1 px-3 py-1.5 text-white text-xs font-semibold rounded-full"
              style={{ backgroundColor: saborActivo.dot }}
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.1 }}>
              {saborActivo.label}<X className="w-3 h-3 ml-0.5" />
            </motion.button>
          )}
          {filtros.tiempoMax !== '' && (
            <motion.button key="t" type="button" onClick={() => onChange({ ...filtros, tiempoMax: '' })}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-semibold rounded-full"
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.1 }}>
              ≤ {filtros.tiempoMax} min<X className="w-3 h-3 ml-0.5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Panel: el fondo ES el sabor seleccionado */}
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />

            <motion.div
              className="absolute left-0 top-12 z-20 rounded-2xl overflow-hidden shadow-2xl"
              style={{ width: 'min(300px, calc(100vw - 2rem))' }}
              initial={{ opacity: 0, y: -10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            >
              {/* Fondo animado — cambia con el sabor */}
              <motion.div
                className="absolute inset-0"
                animate={{ background: panelBg }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
              />
              {/* Luz cenital — esquina superior derecha */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_5%,rgba(255,255,255,0.16)_0%,transparent_55%)] pointer-events-none" />

              <div className="relative z-10 flex flex-col">

                {/* Cabecera: label del sabor activo */}
                <div className="px-5 pt-5 pb-4 border-b border-white/10">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50 mb-1">Perfil de sabor</p>
                  <div className="flex items-center justify-between">
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={filtros.sabor || 'todos'}
                        className="font-display text-xl font-bold text-white"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18 }}
                      >
                        {saborActivo?.label ?? 'Cualquiera'}
                      </motion.p>
                    </AnimatePresence>

                    {/* Selectores de sabor — 5 puntos: neutral + 4 sabores */}
                    <div className="flex items-center gap-2">
                      {/* Punto neutral */}
                      <button
                        type="button"
                        onClick={() => onChange({ ...filtros, sabor: '' })}
                        className={`w-4 h-4 rounded-full border-2 transition-all ${
                          filtros.sabor === ''
                            ? 'bg-white border-white scale-110'
                            : 'bg-white/20 border-white/40 hover:bg-white/35'
                        }`}
                        aria-label="Todos los sabores"
                      />
                      {SABORES.map(({ valor, dot }) => (
                        <button
                          key={valor}
                          type="button"
                          onClick={() => onChange({ ...filtros, sabor: valor })}
                          className={`w-4 h-4 rounded-full border-2 transition-all ${
                            filtros.sabor === valor
                              ? 'scale-125 border-white'
                              : 'border-transparent hover:scale-110 hover:border-white/50'
                          }`}
                          style={{ backgroundColor: dot }}
                          aria-label={valor}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Categoría — glass pills */}
                {categorias.length > 0 && (
                  <div className="px-5 py-3.5 border-b border-white/10">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50 mb-2">Tipo de cocina</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {(['', ...categorias] as string[]).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => onChange({ ...filtros, categoria: c })}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize transition-all ${
                            filtros.categoria === c
                              ? 'bg-white text-gray-900'
                              : 'bg-white/15 text-white/80 border border-white/20 hover:bg-white/25'
                          }`}
                        >
                          {c === '' ? 'Todas' : c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tiempo — glass segmented control */}
                <div className="px-5 py-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50 mb-2">Tiempo máx.</p>
                  <div className="flex gap-1 bg-black/20 rounded-xl p-1">
                    {TIEMPOS.map(({ valor, label }) => (
                      <button
                        key={String(valor)}
                        type="button"
                        onClick={() => onChange({ ...filtros, tiempoMax: valor })}
                        className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                          filtros.tiempoMax === valor
                            ? 'bg-white/20 text-white ring-1 ring-white/30'
                            : 'text-white/60 hover:text-white/90'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Limpiar */}
                {activeCount > 0 && (
                  <div className="px-5 pb-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => { onChange({ categoria: '', sabor: '', tiempoMax: '' }); setOpen(false) }}
                      className="text-[11px] text-white/50 hover:text-white/90 transition-colors underline underline-offset-2"
                    >
                      Limpiar todos
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export type { Filtros }
export default FiltroBar
