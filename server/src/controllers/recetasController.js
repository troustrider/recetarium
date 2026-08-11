import * as recetasService from '../services/recetasService.js'
import { hogarDe } from '../lib/hogar.js'

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
  // La guarnición es opcional, pero si viene tiene que venir entera: sin
  // ingredientes no hay nada que comprar ni que sumar a la ficha.
  if (data.guarnicion != null) {
    const g = data.guarnicion
    if (typeof g !== 'object' || Array.isArray(g)) {
      errores.push('guarnicion debe ser un objeto')
    } else {
      if (!g.nombre?.trim()) errores.push('guarnicion.nombre es obligatorio')
      if (!Array.isArray(g.ingredientes) || g.ingredientes.length === 0) {
        errores.push('guarnicion.ingredientes debe ser un array con al menos un elemento')
      } else {
        g.ingredientes.forEach((ing, i) => {
          if (!ing.nombre?.trim()) errores.push(`guarnicion.ingredientes[${i}].nombre es obligatorio`)
          if (typeof ing.cantidad !== 'number' || ing.cantidad <= 0) errores.push(`guarnicion.ingredientes[${i}].cantidad debe ser mayor que 0`)
          if (!ing.unidad?.trim()) errores.push(`guarnicion.ingredientes[${i}].unidad es obligatorio`)
          if (!ing.familia?.trim()) errores.push(`guarnicion.ingredientes[${i}].familia es obligatorio`)
        })
      }
      if (g.pasos != null && (!Array.isArray(g.pasos) || g.pasos.some((p) => typeof p !== 'string' || !p.trim())))
        errores.push('guarnicion.pasos debe ser un array de textos no vacíos')
    }
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

// Quién puede tocar qué. Una receta del catálogo común solo la edita un admin;
// una privada, quien la tiene.
//
// Si la receta no existe o es de otro hogar, la respuesta es 404 y no 403: decir
// "no tienes permiso" confirmaría que existe.
async function permisoSobre(req, res) {
  const dueno = await recetasService.duenoDe(req.params.id)
  if (!dueno) {
    noEncontrada(res)
    return false
  }
  const { hogarId, rol } = req.usuario
  if (dueno.hogarId === null) {
    if (rol === 'admin') return true
    res.status(403).json({ error: 'El catálogo común solo lo edita un administrador' })
    return false
  }
  if (dueno.hogarId !== hogarId) {
    noEncontrada(res)
    return false
  }
  return true
}

export async function getAll(req, res) {
  const recetas = await recetasService.getAll(hogarDe(req), req.query)
  res.json(recetas)
}

export async function getById(req, res) {
  if (!RE_UUID.test(req.params.id)) return noEncontrada(res)
  const receta = await recetasService.getById(hogarDe(req), req.params.id)
  if (!receta) return noEncontrada(res)
  res.json(receta)
}

export async function create(req, res) {
  const errores = validar(req.body)
  if (errores.length > 0) return res.status(400).json({ errores })
  const hogarId = hogarDe(req)
  // Un admin escribe en el catálogo común salvo que pida lo contrario. Quien no
  // lo es solo puede crear recetas suyas, diga lo que diga el payload.
  const comun = req.usuario.rol === 'admin' && req.body.privada !== true
  const nueva = await recetasService.create(hogarId, comun ? null : hogarId, req.body)
  res.status(201).json(nueva)
}

export async function update(req, res) {
  const errores = validar(req.body)
  if (errores.length > 0) return res.status(400).json({ errores })
  if (!RE_UUID.test(req.params.id)) return noEncontrada(res)
  if (!(await permisoSobre(req, res))) return
  const actualizada = await recetasService.update(hogarDe(req), req.params.id, req.body)
  if (!actualizada) return noEncontrada(res)
  res.json(actualizada)
}

// Favorita no es editar la receta: cualquiera puede marcarse las suyas, también
// las del catálogo común. Basta con que la vea.
export async function toggleFavorita(req, res) {
  if (!RE_UUID.test(req.params.id)) return noEncontrada(res)
  const receta = await recetasService.toggleFavorita(hogarDe(req), req.params.id)
  if (!receta) return noEncontrada(res)
  res.json(receta)
}

export async function remove(req, res) {
  if (!RE_UUID.test(req.params.id)) return noEncontrada(res)
  if (!(await permisoSobre(req, res))) return
  const ok = await recetasService.remove(req.params.id)
  if (!ok) return noEncontrada(res)
  res.status(204).send()
}

export async function restore(req, res) {
  if (!RE_UUID.test(req.params.id)) return noEncontrada(res)
  if (!(await permisoSobre(req, res))) return
  const ok = await recetasService.restore(req.params.id)
  if (!ok) return noEncontrada(res)
  const receta = await recetasService.getById(hogarDe(req), req.params.id)
  res.json(receta)
}
