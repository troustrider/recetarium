import { useState } from 'react'
import type { Receta, Sabor, Ingrediente } from '../../types/receta'
import IngredienteItem from './IngredienteItem'

const SABORES: Sabor[] = ['salado', 'dulce', 'amargo', 'umami']

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

function RecetaForm({ inicial = FORM_VACIO, categorias = [], onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<RecetaFormData>(inicial)
  const [nuevoIngrediente, setNuevoIngrediente] = useState<Ingrediente>({
    nombre: '', cantidad: 0, unidad: '', familia: '',
  })
  const [nuevoPaso, setNuevoPaso] = useState('')
  const [errores, setErrores] = useState<Errores>({})

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
    handleChange('pasos', [...form.pasos, nuevoPaso.trim()])
    setNuevoPaso('')
    setErrores((prev) => ({ ...prev, nuevoPaso: undefined, pasos: undefined }))
  }

  function removePaso(index: number) {
    handleChange('pasos', form.pasos.filter((_, i) => i !== index))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nuevosErrores: Errores = {}
    if (!form.nombre.trim()) nuevosErrores.nombre = 'El nombre es obligatorio'
    if (form.ingredientes.length === 0) nuevosErrores.ingredientes = 'Añade al menos un ingrediente'
    if (form.pasos.length === 0) nuevosErrores.pasos = 'Añade al menos un paso'
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores)
      return
    }
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Datos básicos */}
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => handleChange('nombre', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-200 ${errores.nombre ? 'border-red-400' : 'border-gray-200'}`}
            placeholder="Nombre de la receta"
          />
          {errores.nombre && <p className="mt-1 text-xs text-red-500">{errores.nombre}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <input
              type="text"
              list="categorias-list"
              value={form.categoria}
              onChange={(e) => handleChange('categoria', e.target.value)}
              onBlur={(e) => handleChange('categoria', e.target.value.trim().toLowerCase())}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-200"
              placeholder="ej: italiana, japonesa..."
            />
            {categorias.length > 0 && (
              <datalist id="categorias-list">
                {categorias.map((c) => <option key={c} value={c} />)}
              </datalist>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sabor</label>
            <select
              value={form.sabor}
              onChange={(e) => handleChange('sabor', e.target.value as Sabor)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-200"
            >
              {SABORES.map((s) => (
                <option key={s} value={s} className="capitalize">{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo de preparación (min)</label>
          <input
            type="number"
            min={1}
            value={form.tiempoPreparacion}
            onChange={(e) => handleChange('tiempoPreparacion', Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-200"
          />
        </div>
      </div>

      {/* Ingredientes */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Ingredientes</h3>
        {form.ingredientes.length > 0 && (
          <ul className="mb-3 border border-gray-100 rounded-lg px-3">
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
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
          />
          <input
            type="text"
            placeholder="Familia (ej: lácteos)"
            value={nuevoIngrediente.familia}
            onChange={(e) => setNuevoIngrediente((p) => ({ ...p, familia: e.target.value }))}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
          />
          <input
            type="number"
            placeholder="Cantidad"
            min={0}
            value={nuevoIngrediente.cantidad || ''}
            onChange={(e) => setNuevoIngrediente((p) => ({ ...p, cantidad: Number(e.target.value) }))}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
          />
          <input
            type="text"
            placeholder="Unidad (ej: g, ml)"
            value={nuevoIngrediente.unidad}
            onChange={(e) => setNuevoIngrediente((p) => ({ ...p, unidad: e.target.value }))}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
          />
        </div>
        <button
          type="button"
          onClick={addIngrediente}
          className="mt-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          + Añadir ingrediente
        </button>
        {errores.nuevoIngrediente && <p className="mt-1 text-xs text-red-500">{errores.nuevoIngrediente}</p>}
        {errores.ingredientes && <p className="mt-1 text-xs text-red-500">{errores.ingredientes}</p>}
      </div>

      {/* Pasos */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Pasos</h3>
        {form.pasos.length > 0 && (
          <ol className="mb-3 flex flex-col gap-2">
            {form.pasos.map((paso, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="shrink-0 w-5 h-5 flex items-center justify-center bg-teal-100 text-teal-700 rounded-full text-xs font-medium">
                  {i + 1}
                </span>
                <span className="flex-1 text-gray-800">{paso}</span>
                <button
                  type="button"
                  onClick={() => removePaso(i)}
                  className="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none"
                  aria-label="Eliminar paso"
                >
                  ×
                </button>
              </li>
            ))}
          </ol>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Describe el paso..."
            value={nuevoPaso}
            onChange={(e) => setNuevoPaso(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPaso())}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
          />
          <button
            type="button"
            onClick={addPaso}
            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            + Añadir
          </button>
        </div>
        {errores.nuevoPaso && <p className="mt-1 text-xs text-red-500">{errores.nuevoPaso}</p>}
        {errores.pasos && <p className="mt-1 text-xs text-red-500">{errores.pasos}</p>}
      </div>

      {/* Acciones */}
      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-semibold bg-teal-700 text-white rounded-xl hover:bg-teal-800 transition-colors"
        >
          Guardar
        </button>
      </div>
    </form>
  )
}

export default RecetaForm
