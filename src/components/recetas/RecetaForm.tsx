import { useState } from 'react'
import { Reorder } from 'framer-motion'
import type { Receta, Sabor, Tipo, Ingrediente } from '../../types/receta'
import IngredienteItem from './IngredienteItem'

const SABORES: Sabor[] = ['salado', 'dulce', 'amargo', 'umami', 'acido']
const TIPOS: Tipo[] = ['principal', 'entrante', 'desayuno', 'postre']

type RecetaFormData = Omit<Receta, 'id' | 'favorita'>

interface Props {
  inicial?: RecetaFormData
  categorias?: string[]
  onSubmit: (data: RecetaFormData) => void
  onCancel: () => void
}

const FORM_VACIO: RecetaFormData = {
  nombre: '',
  categoria: '',
  sabor: 'salado',
  tipo: 'principal',
  tiempoPreparacion: 30,
  ingredientes: [],
  pasos: [],
}

interface Errores {
  nombre?: string
  ingredientes?: string
  pasos?: string
  nuevoIngrediente?: string
  nuevoPaso?: string
}

interface PasoItem {
  id: string
  texto: string
}

function DragHandle() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-300 dark:text-gray-600 cursor-grab active:cursor-grabbing">
      <path d="M7 2a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM7 8.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM7 15a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z" />
    </svg>
  )
}

const INPUT_CLASS =
  'w-full px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 dark:focus:ring-orange-700 placeholder-gray-400 dark:placeholder-gray-500'

const LABEL_CLASS = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'

function RecetaForm({ inicial = FORM_VACIO, categorias = [], onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<RecetaFormData>(inicial)
  const [nuevoIngrediente, setNuevoIngrediente] = useState<Ingrediente>({
    nombre: '', cantidad: 0, unidad: '', familia: '',
  })
  const [nuevoPaso, setNuevoPaso] = useState('')
  const [errores, setErrores] = useState<Errores>({})

  const [pasos, setPasos] = useState<PasoItem[]>(
    inicial.pasos.map((t, i) => ({ id: `paso-${i}-${t.slice(0, 8)}`, texto: t }))
  )

  function syncPasos(items: PasoItem[]) {
    setPasos(items)
    setForm((prev) => ({ ...prev, pasos: items.map((p) => p.texto) }))
  }

  function handleChange<K extends keyof RecetaFormData>(key: K, value: RecetaFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (key === 'nombre') setErrores((prev) => ({ ...prev, nombre: undefined }))
  }

  function addIngrediente() {
    const { nombre, cantidad, unidad, familia } = nuevoIngrediente
    if (!nombre.trim() || !unidad.trim() || !familia.trim() || cantidad <= 0) {
      setErrores((prev) => ({ ...prev, nuevoIngrediente: 'Rellena todos los campos del ingrediente (cantidad > 0)' }))
      return
    }
    handleChange('ingredientes', [...form.ingredientes, nuevoIngrediente])
    setNuevoIngrediente({ nombre: '', cantidad: 0, unidad: '', familia: '' })
    setErrores((prev) => ({ ...prev, nuevoIngrediente: undefined, ingredientes: undefined }))
  }

  function removeIngrediente(index: number) {
    handleChange('ingredientes', form.ingredientes.filter((_, i) => i !== index))
  }

  function addPaso() {
    if (!nuevoPaso.trim()) {
      setErrores((prev) => ({ ...prev, nuevoPaso: 'El paso no puede estar vacío' }))
      return
    }
    const item: PasoItem = { id: `paso-${Date.now()}`, texto: nuevoPaso.trim() }
    syncPasos([...pasos, item])
    setNuevoPaso('')
    setErrores((prev) => ({ ...prev, nuevoPaso: undefined, pasos: undefined }))
  }

  function removePaso(id: string) {
    syncPasos(pasos.filter((p) => p.id !== id))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nuevosErrores: Errores = {}
    if (!form.nombre.trim()) nuevosErrores.nombre = 'El nombre es obligatorio'
    if (form.ingredientes.length === 0) nuevosErrores.ingredientes = 'Añade al menos un ingrediente'
    if (pasos.length === 0) nuevosErrores.pasos = 'Añade al menos un paso'
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores)
      return
    }
    onSubmit({ ...form, pasos: pasos.map((p) => p.texto) })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div>
          <label className={LABEL_CLASS}>Nombre</label>
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => handleChange('nombre', e.target.value)}
            className={`${INPUT_CLASS} ${errores.nombre ? 'border-red-400 dark:border-red-500' : ''}`}
            placeholder="Nombre de la receta"
          />
          {errores.nombre && <p className="mt-1 text-xs text-red-500">{errores.nombre}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASS}>Categoría</label>
            <input
              type="text"
              list="categorias-list"
              value={form.categoria}
              onChange={(e) => handleChange('categoria', e.target.value)}
              onBlur={(e) => handleChange('categoria', e.target.value.trim().toLowerCase())}
              className={INPUT_CLASS}
              placeholder="ej: italiana, japonesa..."
            />
            {categorias.length > 0 && (
              <datalist id="categorias-list">
                {categorias.map((c) => <option key={c} value={c} />)}
              </datalist>
            )}
          </div>

          <div>
            <label className={LABEL_CLASS}>Sabor</label>
            <select
              value={form.sabor}
              onChange={(e) => handleChange('sabor', e.target.value as Sabor)}
              className={INPUT_CLASS}
            >
              {SABORES.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASS}>Tipo de plato</label>
            <select
              value={form.tipo ?? 'principal'}
              onChange={(e) => handleChange('tipo', e.target.value as Tipo)}
              className={INPUT_CLASS}
            >
              {TIPOS.map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL_CLASS}>Tiempo de preparación (min)</label>
            <input
              type="number"
              min={1}
              value={form.tiempoPreparacion}
              onChange={(e) => handleChange('tiempoPreparacion', Number(e.target.value))}
              className={INPUT_CLASS}
            />
          </div>
        </div>

        <div>
          <label className={LABEL_CLASS}>URL de imagen <span className="text-gray-400 dark:text-gray-500 font-normal">(opcional)</span></label>
          <input
            type="url"
            value={form.imagen ?? ''}
            onChange={(e) => handleChange('imagen', e.target.value || undefined)}
            className={INPUT_CLASS}
            placeholder="https://..."
          />
        </div>
      </div>

      {/* Coste y nutrición (opcional, por porción) */}
      <div>
        <h3 className={LABEL_CLASS}>Coste y nutrición <span className="text-gray-400 dark:text-gray-500 font-normal">(opcional, por porción)</span></h3>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input type="number" min={0} step="0.01" placeholder="€ / porción" value={form.precioPorPorcion ?? ''}
            onChange={(e) => handleChange('precioPorPorcion', e.target.value === '' ? undefined : Number(e.target.value))} className={INPUT_CLASS} />
          <input type="number" min={1} placeholder="Porciones" value={form.porciones ?? ''}
            onChange={(e) => handleChange('porciones', e.target.value === '' ? undefined : Number(e.target.value))} className={INPUT_CLASS} />
        </div>
        <div className="grid grid-cols-4 gap-2">
          <input type="number" min={0} placeholder="Kcal" value={form.calorias ?? ''}
            onChange={(e) => handleChange('calorias', e.target.value === '' ? undefined : Number(e.target.value))} className={INPUT_CLASS} />
          <input type="number" min={0} step="0.1" placeholder="Prot. g" value={form.proteinas ?? ''}
            onChange={(e) => handleChange('proteinas', e.target.value === '' ? undefined : Number(e.target.value))} className={INPUT_CLASS} />
          <input type="number" min={0} step="0.1" placeholder="Carb. g" value={form.carbohidratos ?? ''}
            onChange={(e) => handleChange('carbohidratos', e.target.value === '' ? undefined : Number(e.target.value))} className={INPUT_CLASS} />
          <input type="number" min={0} step="0.1" placeholder="Grasa g" value={form.grasas ?? ''}
            onChange={(e) => handleChange('grasas', e.target.value === '' ? undefined : Number(e.target.value))} className={INPUT_CLASS} />
        </div>
      </div>

      {/* Ingredientes */}
      <div>
        <h3 className={LABEL_CLASS}>Ingredientes</h3>
        {form.ingredientes.length > 0 && (
          <ul className="mb-3 border border-gray-100 dark:border-gray-700 rounded-lg px-3 bg-white dark:bg-gray-900">
            {form.ingredientes.map((ing, i) => (
              <IngredienteItem key={i} ingrediente={ing} onRemove={() => removeIngrediente(i)} />
            ))}
          </ul>
        )}
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Nombre"
            value={nuevoIngrediente.nombre}
            onChange={(e) => setNuevoIngrediente((p) => ({ ...p, nombre: e.target.value }))}
            className={INPUT_CLASS}
          />
          <input
            type="text"
            placeholder="Familia (ej: lácteos)"
            value={nuevoIngrediente.familia}
            onChange={(e) => setNuevoIngrediente((p) => ({ ...p, familia: e.target.value }))}
            className={INPUT_CLASS}
          />
          <input
            type="number"
            placeholder="Cantidad"
            min={0}
            value={nuevoIngrediente.cantidad || ''}
            onChange={(e) => setNuevoIngrediente((p) => ({ ...p, cantidad: Number(e.target.value) }))}
            className={INPUT_CLASS}
          />
          <input
            type="text"
            placeholder="Unidad (ej: g, ml)"
            value={nuevoIngrediente.unidad}
            onChange={(e) => setNuevoIngrediente((p) => ({ ...p, unidad: e.target.value }))}
            className={INPUT_CLASS}
          />
        </div>
        <button
          type="button"
          onClick={addIngrediente}
          className="mt-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          + Añadir ingrediente
        </button>
        {errores.nuevoIngrediente && <p className="mt-1 text-xs text-red-500">{errores.nuevoIngrediente}</p>}
        {errores.ingredientes && <p className="mt-1 text-xs text-red-500">{errores.ingredientes}</p>}
      </div>

      {/* Pasos con drag & drop */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className={LABEL_CLASS}>Pasos</h3>
          {pasos.length > 1 && (
            <span className="text-xs text-gray-400 dark:text-gray-500">Arrastra para reordenar</span>
          )}
        </div>
        {pasos.length > 0 && (
          <Reorder.Group
            axis="y"
            values={pasos}
            onReorder={syncPasos}
            className="mb-3 flex flex-col gap-1"
          >
            {pasos.map((paso, i) => (
              <Reorder.Item
                key={paso.id}
                value={paso}
                className="flex items-start gap-2 text-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-3 py-2 cursor-default"
              >
                <DragHandle />
                <span className="shrink-0 w-5 h-5 flex items-center justify-center bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 rounded-full text-xs font-medium mt-0.5">
                  {i + 1}
                </span>
                <span className="flex-1 text-gray-800 dark:text-gray-200">{paso.texto}</span>
                <button
                  type="button"
                  onClick={() => removePaso(paso.id)}
                  className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors text-lg leading-none mt-0.5"
                  aria-label="Eliminar paso"
                >
                  ×
                </button>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Describe el paso..."
            value={nuevoPaso}
            onChange={(e) => setNuevoPaso(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPaso())}
            className={`flex-1 ${INPUT_CLASS}`}
          />
          <button
            type="button"
            onClick={addPaso}
            className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            + Añadir
          </button>
        </div>
        {errores.nuevoPaso && <p className="mt-1 text-xs text-red-500">{errores.nuevoPaso}</p>}
        {errores.pasos && <p className="mt-1 text-xs text-red-500">{errores.pasos}</p>}
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-semibold bg-orange-700 dark:bg-orange-600 text-white rounded-xl hover:bg-orange-800 dark:hover:bg-orange-700 transition-colors"
        >
          Guardar
        </button>
      </div>
    </form>
  )
}

export default RecetaForm
