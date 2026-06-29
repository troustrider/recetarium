import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { Ingrediente } from '../../types/receta'

interface Props {
  onAdd: (item: Ingrediente) => void
}

const INPUT = 'px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-orange-300 placeholder-gray-400'

function AnadirManual({ onAdd }: Props) {
  const [nombre, setNombre] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [unidad, setUnidad] = useState('ud')
  const [familia, setFamilia] = useState('otros')

  function submit() {
    if (!nombre.trim()) return
    onAdd({
      nombre: nombre.trim(),
      cantidad: Number(cantidad) > 0 ? Number(cantidad) : 1,
      unidad: unidad.trim() || 'ud',
      familia: familia.trim().toLowerCase() || 'otros',
    })
    setNombre('')
    setCantidad('')
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-3">Añadir a mano</p>
      <div className="flex flex-wrap gap-2">
        <input
          className={`${INPUT} flex-1 min-w-[140px]`}
          placeholder="Ej: detergente, leche..."
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        <input className={`${INPUT} w-20`} type="number" min={0} placeholder="Cant." value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
        <input className={`${INPUT} w-20`} placeholder="ud" value={unidad} onChange={(e) => setUnidad(e.target.value)} />
        <input className={`${INPUT} w-28`} placeholder="familia" value={familia} onChange={(e) => setFamilia(e.target.value)} />
        <button
          onClick={submit}
          className="flex items-center gap-1 px-4 py-2 text-sm font-bold bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Añadir
        </button>
      </div>
    </div>
  )
}

export default AnadirManual
