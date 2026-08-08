import * as recetasService from '../services/recetasService.js'

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
  if (data.consejos != null) {
    if (!Array.isArray(data.consejos))
      errores.push('consejos debe ser un array')
    else if (data.consejos.some((c) => typeof c !== 'string' || !c.trim()))
      errores.push('cada consejo debe ser un texto no vacío')
  }
  ;['calorias', 'proteinas', 'carbohidratos', 'grasas'].forEach((k) => {
    if (data[k] != null && (typeof data[k] !== 'number' || data[k] < 0))
      errores.push(`${k} debe ser un número >= 0`)
  })
  return errores
}

// Los ids son UUID en la BD: sin este filtro, Postgres revienta al castear y
// un id mal escrito acaba en 500 en vez de en 404.
const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const noEncontrada = (res) => res.status(404).json({ error: 'Receta no encontrada' })

export async function getAll(req, res) {
  const recetas = await recetasService.getAll(req.query)
  res.json(recetas)
}

export async function getById(req, res) {
  if (!RE_UUID.test(req.params.id)) return noEncontrada(res)
  const receta = await recetasService.getById(req.params.id)
  if (!receta) return noEncontrada(res)
  res.json(receta)
}

export async function create(req, res) {
  const errores = validar(req.body)
  if (errores.length > 0) return res.status(400).json({ errores })
  const nueva = await recetasService.create(req.body)
  res.status(201).json(nueva)
}

export async function update(req, res) {
  const errores = validar(req.body)
  if (errores.length > 0) return res.status(400).json({ errores })
  if (!RE_UUID.test(req.params.id)) return noEncontrada(res)
  const actualizada = await recetasService.update(req.params.id, req.body)
  if (!actualizada) return noEncontrada(res)
  res.json(actualizada)
}

export async function toggleFavorita(req, res) {
  if (!RE_UUID.test(req.params.id)) return noEncontrada(res)
  const receta = await recetasService.toggleFavorita(req.params.id)
  if (!receta) return noEncontrada(res)
  res.json(receta)
}

export async function remove(req, res) {
  if (!RE_UUID.test(req.params.id)) return noEncontrada(res)
  const ok = await recetasService.remove(req.params.id)
  if (!ok) return noEncontrada(res)
  res.status(204).send()
}

export async function restore(req, res) {
  if (!RE_UUID.test(req.params.id)) return noEncontrada(res)
  const ok = await recetasService.restore(req.params.id)
  if (!ok) return noEncontrada(res)
  const receta = await recetasService.getById(req.params.id)
  res.json(receta)
}
