import { motion } from 'framer-motion'
import type { Dia } from '../../context/PlanificadorContext'
import type { PendientePlan } from '../../context/PendientesPlanContext'
import Capa from '../shared/Capa'

interface SelectorDiaProps {
  pendiente: PendientePlan
  dias: readonly Dia[]
  onSeleccionar: (dia: Dia) => void
  onCerrar: () => void
}

export default function SelectorDia({ pendiente, dias, onSeleccionar, onCerrar }: SelectorDiaProps) {
  return (
    <Capa onCerrar={onCerrar}>
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            ¿Qué día cocinas <span className="text-gray-700 dark:text-gray-200">{pendiente.receta.nombre}</span>?
          </p>
        </div>
        <ul>
          {dias.map((dia) => (
            <motion.li key={dia} whileHover={{ backgroundColor: 'rgba(249,115,22,0.05)' }}>
              <button
                className="w-full px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100"
                onClick={() => { onSeleccionar(dia); onCerrar() }}
              >
                {dia}
              </button>
            </motion.li>
          ))}
        </ul>
    </Capa>
  )
}
