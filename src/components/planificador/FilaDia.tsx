import { motion, AnimatePresence } from 'framer-motion'
import { useDroppable } from '@dnd-kit/core'
import type { Dia, EntradaPlan } from '../../context/PlanificadorContext'
import { MOMENTOS, NOMBRE_MOMENTO, momentoDe, type Momento } from '../../utils/momentos'
import { MOMENTO_ESTILO } from './estilos'
import RecetaChip from './RecetaChip'

interface FilaDiaProps {
  dia: Dia
  entradas: EntradaPlan[]
  onAñadir: () => void
  onQuitar: (id: string) => void
  onRaciones: (id: string, n: number) => void
  onCocinar: (entrada: EntradaPlan) => void
  onGuarnicion: (id: string, conGuarnicion: boolean) => void
  onMomento: (id: string, momento: Momento) => void
  isDragOver: boolean
}

export default function FilaDia({ dia, entradas, onAñadir, onQuitar, onRaciones, onCocinar, onGuarnicion, onMomento, isDragOver }: FilaDiaProps) {
  const { setNodeRef } = useDroppable({ id: dia })

  const carriles = MOMENTOS
    .map((momento) => ({ momento, entradas: entradas.filter((e) => momentoDe(e) === momento) }))
    .filter((c) => c.entradas.length > 0)

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-start rounded-2xl border transition-colors p-4 min-h-[68px] ${
        isDragOver
          ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/10'
          : 'bg-stone-100 dark:bg-gray-900 border-stone-200 dark:border-gray-800'
      }`}
    >
      <div className="w-full sm:w-16 shrink-0 sm:pt-1">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          {dia.slice(0, 3)}
        </p>
      </div>

      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <AnimatePresence initial={false}>
          {carriles.map(({ momento, entradas: delCarril }) => {
            const { Icono, texto } = MOMENTO_ESTILO[momento]
            return (
              <motion.div
                key={momento}
                layout
                className="flex flex-wrap items-center gap-x-2 gap-y-1.5 min-w-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
              >
                <span className={`flex items-center gap-1 shrink-0 sm:w-[86px] text-[10px] font-bold uppercase tracking-widest ${texto}`}>
                  <Icono className="w-3 h-3" />
                  {NOMBRE_MOMENTO[momento]}
                </span>
                {delCarril.map((entrada) => (
                  <motion.div
                    key={entrada.id}
                    layoutId={entrada.id}
                    layout
                    className="min-w-0 max-w-full"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <RecetaChip
                      entrada={entrada}
                      dia={dia}
                      onQuitar={() => onQuitar(entrada.id)}
                      onRaciones={(n) => onRaciones(entrada.id, n)}
                      onCocinar={() => onCocinar(entrada)}
                      onGuarnicion={(v) => onGuarnicion(entrada.id, v)}
                      onMomento={(m) => onMomento(entrada.id, m)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )
          })}
        </AnimatePresence>

        <button
          onClick={onAñadir}
          className="self-start flex items-center gap-1 px-3 py-2 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 hover:border-orange-300 dark:hover:border-orange-700 transition-colors"
        >
          + Añadir
        </button>
      </div>
    </div>
  )
}
