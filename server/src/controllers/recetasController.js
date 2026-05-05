const recetasService = require('../services/recetasService')

const SABORES_VALIDOS = ['salado', 'dulce', 'amargo', 'umami', 'acido']

function validar(data) {
  const errores = []
  if (!data.nombre || typeof data.nombre !== 'string' || !data.nombre.trim())
    errores.push('nombre es obligatorio')
  if (!data.sabor || !SABORES_VALIDOS.includes(data.sabor))
    errores.push(`sabor debe ser uno de: ${SABORES_VALIDOS.join(', ')}`)
  if (!data.tiempoPreparacion || typeof data.tiempoPreparacion !== 'number' || data.tiempoPreparacion <= 0)
    errores.push('tiempoPreparacion debe ser un número mayor que 0')
  if (!Array.isArray(data.ingredientes) || data.ingredientes.length === 0)
    errores.push('ingredientes debe ser un array con al menos un elemento')
  else {
    data.ingredientes.forEach((ing, i) => {
      if (!ing.nombre?.trim()) errores.push(`ingredientes[${i}].nombre es obligatorio`)
      if (typeof ing.cantidad !== 'number' || ing.cantidad <= 0) errores.push(`ingredientes[${i}].cantidad debe ser mayor que 0`)
      if (!ing.unidad?.trim()) errores.push(`ingredientes[${i}].unidad es obligatorio`)
      if (!ing.familia?.trim()) errores.push(`ingredientes[${i}].familia es obligatorio`)
    })
  }
  if (!Array.isArray(data.pasos) || data.pasos.length === 0)
    errores.push('pasos debe ser un array con al menos un elemento')
  else if (data.pasos.some((p) => typeof p !== 'string' || !p.trim()))
    errores.push('cada paso debe ser un texto no vacío')
  return errores
}

async function getAll(req, res) {
  const recetas = await recetasService.getAll(req.query)
  res.json(recetas)
}

async function getById(req, res) {
  const receta = await recetasService.getById(req.params.id)
  if (!receta) return res.status(404).json({ error: 'Receta no encontrada' })
  res.json(receta)
}

async function create(req, res) {
  const errores = validar(req.body)
  if (errores.length > 0) return res.status(400).json({ errores })
  const nueva = await recetasService.create(req.body)
  res.status(201).json(nueva)
}

async function update(req, res) {
  const errores = validar(req.body)
  if (errores.length > 0) return res.status(400).json({ errores })
  const actualizada = await recetasService.update(req.params.id, req.body)
  if (!actualizada) return res.status(404).json({ error: 'Receta no encontrada' })
  res.json(actualizada)
}

async function toggleFavorita(req, res) {
  const receta = await recetasService.toggleFavorita(req.params.id)
  if (!receta) return res.status(404).json({ error: 'Receta no encontrada' })
  res.json(receta)
}

async function remove(req, res) {
  const ok = await recetasService.remove(req.params.id)
  if (!ok) return res.status(404).json({ error: 'Receta no encontrada' })
  res.status(204).send()
}

module.exports = { getAll, getById, create, update, toggleFavorita, remove }
