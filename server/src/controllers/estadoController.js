import * as estadoService from '../services/estadoService.js'

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

function validarPlan(plan) {
  if (!Array.isArray(plan)) return 'plan debe ser un array'
  for (let i = 0; i < plan.length; i++) {
    const e = plan[i]
    if (!e || typeof e !== 'object') return `plan[${i}] debe ser un objeto`
    if (!DIAS.includes(e.dia)) return `plan[${i}].dia debe ser uno de: ${DIAS.join(', ')}`
    if (typeof e.recetaId !== 'string' || !e.recetaId.trim()) return `plan[${i}].recetaId es obligatorio`
    if (typeof e.raciones !== 'number' || e.raciones < 1) return `plan[${i}].raciones debe ser >= 1`
  }
  return null
}

export async function getPlan(req, res) {
  const plan = await estadoService.getPlan()
  res.json(plan)
}

export async function putPlan(req, res) {
  const error = validarPlan(req.body)
  if (error) return res.status(400).json({ error })
  const guardado = await estadoService.setPlan(req.body)
  res.json(guardado)
}

const ESTADOS_DESPENSA = ['lleno', 'poco']

function validarDespensa(despensa) {
  if (!Array.isArray(despensa)) return 'despensa debe ser un array'
  for (let i = 0; i < despensa.length; i++) {
    const d = despensa[i]
    if (!d || typeof d !== 'object') return `despensa[${i}] debe ser un objeto`
    if (typeof d.nombre !== 'string' || !d.nombre.trim()) return `despensa[${i}].nombre es obligatorio`
    if (typeof d.familia !== 'string' || !d.familia.trim()) return `despensa[${i}].familia es obligatorio`
    if (!ESTADOS_DESPENSA.includes(d.estado)) return `despensa[${i}].estado debe ser uno de: ${ESTADOS_DESPENSA.join(', ')}`
    if (d.caducidad != null && !/^\d{4}-\d{2}-\d{2}$/.test(d.caducidad)) return `despensa[${i}].caducidad debe ser una fecha YYYY-MM-DD`
  }
  return null
}

export async function getDespensa(req, res) {
  const despensa = await estadoService.getDespensa()
  res.json(despensa)
}

export async function putDespensa(req, res) {
  const error = validarDespensa(req.body)
  if (error) return res.status(400).json({ error })
  const guardado = await estadoService.setDespensa(req.body)
  res.json(guardado)
}

function validarPendientes(pendientes) {
  if (!Array.isArray(pendientes)) return 'pendientes debe ser un array'
  for (let i = 0; i < pendientes.length; i++) {
    const p = pendientes[i]
    if (!p || typeof p !== 'object') return `pendientes[${i}] debe ser un objeto`
    if (typeof p.recetaId !== 'string' || !p.recetaId.trim()) return `pendientes[${i}].recetaId es obligatorio`
    if (typeof p.raciones !== 'number' || p.raciones < 1) return `pendientes[${i}].raciones debe ser >= 1`
  }
  return null
}

export async function getPendientes(req, res) {
  const pendientes = await estadoService.getPendientes()
  res.json(pendientes)
}

export async function putPendientes(req, res) {
  const error = validarPendientes(req.body)
  if (error) return res.status(400).json({ error })
  const guardado = await estadoService.setPendientes(req.body)
  res.json(guardado)
}

function validarExtras(extras) {
  if (!Array.isArray(extras)) return 'extras debe ser un array'
  for (let i = 0; i < extras.length; i++) {
    const e = extras[i]
    if (!e || typeof e !== 'object') return `extras[${i}] debe ser un objeto`
    if (typeof e.nombre !== 'string' || !e.nombre.trim()) return `extras[${i}].nombre es obligatorio`
    if (typeof e.cantidad !== 'number' || e.cantidad <= 0) return `extras[${i}].cantidad debe ser > 0`
    if (typeof e.unidad !== 'string' || !e.unidad.trim()) return `extras[${i}].unidad es obligatorio`
    if (typeof e.familia !== 'string' || !e.familia.trim()) return `extras[${i}].familia es obligatorio`
  }
  return null
}

export async function getExtras(req, res) {
  const extras = await estadoService.getExtras()
  res.json(extras)
}

export async function putExtras(req, res) {
  const error = validarExtras(req.body)
  if (error) return res.status(400).json({ error })
  const guardado = await estadoService.setExtras(req.body)
  res.json(guardado)
}
