import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRecetasContext } from '../context'
import RecetaForm from '../components/recetas/RecetaForm'
import type { Receta } from '../types/receta'

type RecetaFormData = Omit<Receta, 'id' | 'favorita'>

function NuevaReceta() {
  const { crear, recetas } = useRecetasContext()
  const navigate = useNavigate()

  const categorias = useMemo(
    () => [...new Set(recetas.map((r) => r.categoria))].filter(Boolean).sort(),
    [recetas]
  )

  async function handleSubmit(data: RecetaFormData) {
    const nueva = await crear(data)
    if (nueva) navigate(`/recetas/${nueva.id}`)
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-bold text-gray-900">Nueva receta</h1>
      <RecetaForm categorias={categorias} onSubmit={handleSubmit} onCancel={() => navigate(-1)} />
    </div>
  )
}

export default NuevaReceta
