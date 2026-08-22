import { useState } from 'react'
import type { EntradaPlan } from '../../context/PlanificadorContext'
import type { ConsumoIngrediente } from '../../utils/consumo'
import { formatCantidad } from '../../utils/ingredientes'
import Capa from '../shared/Capa'

interface ConfirmarCocinadaProps {
  entrada: EntradaPlan
  consumos: ConsumoIngrediente[]
  onConfirmar: (elegidos: ConsumoIngrediente[]) => void
  onCerrar: () => void
}

export default function ConfirmarCocinada({ entrada, consumos, onConfirmar, onCerrar }: ConfirmarCocinadaProps) {
  const [excluidos, setExcluidos] = useState<Set<string>>(new Set())

  const alternar = (nombre: string) =>
    setExcluidos((prev) => {
      const sig = new Set(prev)
      if (!sig.delete(nombre)) sig.add(nombre)
      return sig
    })

  return (
    <Capa onCerrar={onCerrar}>
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-500 dark:text-emerald-400">
            Ya está hecha
          </p>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">
            {entrada.receta.nombre} · {entrada.raciones} {entrada.raciones === 1 ? 'ración' : 'raciones'}
          </p>
        </div>

        {consumos.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-400 dark:text-gray-500">
            No hay nada de esta receta en la despensa que descontar.
          </p>
        ) : (
          <ul className="max-h-72 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
            {consumos.map((c) => {
              const activo = !excluidos.has(c.nombre)
              return (
                <li key={c.nombre}>
                  <button
                    onClick={() => alternar(c.nombre)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left"
                  >
                    <span
                      className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center text-[10px] font-bold ${
                        activo
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-gray-300 dark:border-gray-600 text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-sm font-semibold truncate ${activo ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 line-through'}`}>
                        {c.nombre}
                      </span>
                      <span className="block text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 truncate">
                        {c.usadoPor.join(', ')}
                      </span>
                    </span>
                    <span className={`shrink-0 text-[11px] font-bold ${c.accion === 'quitar' ? 'text-red-400' : 'text-gray-400'}`}>
                      {c.accion === 'quitar' ? 'se acaba' : `quedan ${formatCantidad(c.cantidad!, c.unidad!)}`}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        <div className="flex gap-2 p-4 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={onCerrar}
            className="flex-1 py-2 rounded-xl text-sm font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => { onConfirmar(consumos.filter((c) => !excluidos.has(c.nombre))); onCerrar() }}
            className="flex-1 py-2 rounded-xl text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
          >
            Vaciar y marcar
          </button>
        </div>
    </Capa>
  )
}
