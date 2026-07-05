import { motion } from 'framer-motion'
import type { IngredienteDespensa } from '../../context/DespensaContext'
import { infoCaducidad } from '../../utils/despensa'

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

interface Props {
  item: IngredienteDespensa
  onClick: () => void
}

// La tarjeta "envejece" con la caducidad: neutra de lejos, ámbar a 2-3 días,
// roja cuando caduca hoy/mañana o ya caducó.
const TINTES = {
  rojo: 'bg-red-50 border-red-200 hover:border-red-300 dark:bg-red-900/20 dark:border-red-800 dark:hover:border-red-700',
  ambar: 'bg-amber-50 border-amber-200 hover:border-amber-300 dark:bg-amber-900/20 dark:border-amber-800 dark:hover:border-amber-700',
  neutro: 'bg-white border-gray-100 hover:border-orange-200 dark:bg-gray-900 dark:border-gray-800 dark:hover:border-orange-800',
}

function TarjetaIngrediente({ item, onClick }: Props) {
  const esLleno = item.estado === 'lleno'
  const cad = infoCaducidad(item.caducidad)
  const urgente = cad?.urgente ?? false
  const tinte = urgente ? TINTES.rojo : cad?.pronto ? TINTES.ambar : TINTES.neutro

  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className={`relative overflow-hidden text-left rounded-2xl border p-3.5 flex flex-col gap-2.5 transition-colors ${tinte}`}
    >
      {/* Cifra fantasma: días restantes como marca de agua cuando urge */}
      {cad != null && cad.pronto && (
        <span
          aria-hidden="true"
          className={`absolute -top-3 right-1 font-display font-black text-5xl leading-none select-none pointer-events-none ${
            urgente ? 'text-red-500/15 dark:text-red-400/20' : 'text-amber-500/20 dark:text-amber-400/20'
          }`}
        >
          {Math.max(cad.dias, 0)}
        </span>
      )}

      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 pr-5 leading-snug">
        {capitalize(item.nombre)}
      </span>

      <span className="h-1 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <span
          className={`block h-full rounded-full transition-all ${
            esLleno ? 'w-full bg-emerald-500' : 'w-1/3 bg-amber-400'
          }`}
        />
      </span>

      <span className="flex items-center justify-between gap-2 text-[11px] min-h-4">
        <span className={`font-medium ${esLleno ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
          {esLleno ? 'De sobra' : 'Queda poco'}
        </span>
        {cad != null && (
          <span
            className={`font-semibold ${
              urgente
                ? 'text-red-600 dark:text-red-400'
                : cad.pronto
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            {cad.label}
          </span>
        )}
      </span>
    </motion.button>
  )
}

export default TarjetaIngrediente
