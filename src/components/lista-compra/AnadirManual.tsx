import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { Ingrediente } from '../../types/receta'

interface Props {
  onAdd: (item: Ingrediente) => void
}

// Secciones del súper (familia) para agrupar la lista de forma coherente.
const SECCIONES = [
  'verduras', 'frutas', 'carnes', 'pescados', 'lacteos', 'huevos',
  'cereales', 'legumbres', 'condimentos', 'salsas', 'bebidas', 'otros',
]
const UNIDADES = ['ud', 'g', 'ml', 'paquete', 'lata', 'manojo']

const LABEL = 'block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1'
const FIELD = 'w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-orange-300 placeholder-gray-400'

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
      unidad,
      familia,
    })
    setNombre('')
    setCantidad('')
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-3">Añadir a mano</p>

      <div className="mb-3">
        <label className={LABEL} htmlFor="manual-nombre">Producto</label>
        <input
          id="manual-nombre"
          className={FIELD}
          placeholder="Ej: detergente, leche, papel de cocina…"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div>
          <label className={LABEL} htmlFor="manual-cant">Cantidad</label>
          <input id="manual-cant" className={FIELD} type="number" min={0} inputMode="decimal" placeholder="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
        </div>
        <div>
          <label className={LABEL} htmlFor="manual-unidad">Unidad</label>
          <select id="manual-unidad" className={FIELD} value={unidad} onChange={(e) => setUnidad(e.target.value)}>
            {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL} htmlFor="manual-familia">Sección</label>
          <select id="manual-familia" className={FIELD} value={familia} onChange={(e) => setFamilia(e.target.value)}>
            {SECCIONES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
      </div>

      <button
        onClick={submit}
        disabled={!nombre.trim()}
        className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-bold bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Plus className="w-4 h-4" />
        Añadir a la lista
      </button>
    </div>
  )
}

export default AnadirManual
