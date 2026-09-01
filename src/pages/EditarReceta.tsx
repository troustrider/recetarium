import { useMemo } from 'react'
import type { RecetaFormData } from '../api/client'
import { useParams, useNavigate } from 'react-router-dom'
import { useRecetasContext } from '../context'
import useReceta from '../hooks/useReceta'
import RecetaForm from '../components/recetas/RecetaForm'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import ErrorMessage from '../components/shared/ErrorMessage'
import useTitulo from '../hooks/useTitulo'


function EditarReceta() {
  const { id } = useParams<{ id: string }>()
  const { actualizar, recetas } = useRecetasContext()
  const { receta, loading, error } = useReceta(id!)
  useTitulo(receta ? `Editar ${receta.nombre}` : 'Editar receta')

  const categorias = useMemo(
    () => [...new Set(recetas.map((r) => r.categoria))].filter(Boolean).sort(),
    [recetas]
  )
  const navigate = useNavigate()

  if (loading) return <LoadingSpinner />
  if (error || !receta) return <ErrorMessage message={error ?? 'Receta no encontrada'} />

  // El formulario habla de guarniciones por nombre, que es lo que come la API.
  const { id: _id, favorita: _fav, guarniciones, ...resto } = receta
  const inicial: RecetaFormData = { ...resto, guarniciones: (guarniciones ?? []).map((g) => g.nombre) }

  async function handleSubmit(data: RecetaFormData) {
    const ok = await actualizar(receta!.id, data, inicial)
    if (ok) navigate(`/recetas/${receta!.id}`)
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-bold text-gray-900">Editar receta</h1>
      <RecetaForm
        inicial={inicial}
        categorias={categorias}
        onSubmit={handleSubmit}
        onCancel={() => navigate(-1)}
      />
    </div>
  )
}

export default EditarReceta
