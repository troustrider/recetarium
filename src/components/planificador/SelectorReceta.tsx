import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { Dia } from '../../context/PlanificadorContext'
import type { RecetaListada } from '../../types/receta'
import { MOMENTOS, NOMBRE_MOMENTO, momentoPorDefecto, type Momento } from '../../utils/momentos'
import { MOMENTO_ESTILO, SABOR_STRIP } from './estilos'
import Capa from '../shared/Capa'

interface SelectorProps {
  dia: Dia
  recetas: RecetaListada[]
  faltanPorReceta: Map<string, number> | null
  onSeleccionar: (receta: RecetaListada, momento: Momento) => void
  onCerrar: () => void
}

export default function SelectorReceta({ dia, recetas, faltanPorReceta, onSeleccionar, onCerrar }: SelectorProps) {
  const [busqueda, setBusqueda] = useState('')

  const [momento, setMomento] = useState<Momento | null>(null)
  const filtradas = useMemo(() => {
    const lista = recetas.filter((r) => r.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    if (!faltanPorReceta) return lista
    return [...lista].sort(
      (a, b) => (faltanPorReceta.get(a.id) ?? 99) - (faltanPorReceta.get(b.id) ?? 99)
    )
  }, [recetas, busqueda, faltanPorReceta])

  return (
    <Capa onCerrar={onCerrar}>
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
            Añadir al {dia}
          </p>
          <div className="flex gap-1.5 mb-2">
            {MOMENTOS.map((m) => {
              const { Icono, texto } = MOMENTO_ESTILO[m]
              const activo = momento === m
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMomento(activo ? null : m)}
                  aria-pressed={activo}
                  className={`flex flex-1 items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                    activo
                      ? `${MOMENTO_ESTILO[m].boton} ring-1 ring-current`
                      : `bg-gray-50 dark:bg-gray-800 ${texto} hover:bg-gray-100 dark:hover:bg-gray-700`
                  }`}
                >
                  <Icono className="w-3.5 h-3.5" />
                  {NOMBRE_MOMENTO[m]}
                </button>
              )
            })}
          </div>
          {momento === null && (
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-2">
              Sin elegir, cada receta cae en su hueco: los desayunos al desayuno y el resto a la cena.
            </p>
          )}
          <input
            type="text"
            placeholder="Buscar receta..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 dark:text-gray-100"
            autoFocus
          />
        </div>
        <ul className="max-h-72 overflow-y-auto">
          {filtradas.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-gray-400">Sin resultados</li>
          ) : (
            filtradas.map((receta) => {
              const faltan = faltanPorReceta?.get(receta.id)
              return (
                <motion.li key={receta.id} whileHover={{ backgroundColor: 'rgba(249,115,22,0.05)' }}>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-left"
                    onClick={() => {
                      onSeleccionar(receta, momento ?? momentoPorDefecto(receta.tipo))
                      onCerrar()
                    }}
                  >
                    <div className={`w-1 h-8 rounded-full shrink-0 ${SABOR_STRIP[receta.sabor]}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{receta.nombre}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">{receta.categoria}</p>
                    </div>
                    {faltan != null && (
                      <span
                        className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          faltan === 0
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : faltan <= 3
                              ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                              : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                        }`}
                      >
                        {faltan === 0 ? 'la tenéis' : faltan === 1 ? 'falta 1' : `faltan ${faltan}`}
                      </span>
                    )}
                  </button>
                </motion.li>
              )
            })
          )}
        </ul>
    </Capa>
  )
}
