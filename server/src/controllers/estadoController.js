import * as estadoService from '../services/estadoService.js'
import { hogarDe } from '../lib/hogar.js'

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

function validarPlan(plan) {
  if (!Array.isArray(plan)) return 'plan debe ser un array'
  for (let i = 0; i < plan.length; i++) {
    const e = plan[i]
    if (!e || typeof e !== 'object') return `plan[${i}] debe ser un objeto`
    if (!DIAS.includes(e.dia)) return `plan[${i}].dia debe ser uno de: ${DIAS.join(', ')}`
    if (typeof e.recetaId !== 'string' || !e.recetaId.trim()) return `plan[${i}].recetaId es obligatorio`
    if (typeof e.raciones !== 'number' || e.raciones < 1) return `plan[${i}].raciones debe ser >= 1`
    if (e.cocinada != null && typeof e.cocinada !== 'boolean') return `plan[${i}].cocinada debe ser booleano`
  }
  return null
}

const ESTADOS_DESPENSA = ['lleno', 'poco']

// Misma lista que UNIDADES_DESPENSA en src/utils/cantidades.ts. No se comparte
// el fichero porque el deploy solo empaqueta server/src (ver vercel.json).
const UNIDADES_DESPENSA = ['g', 'kg', 'ml', 'l', 'ud']

function validarDespensa(despensa) {
  if (!Array.isArray(despensa)) return 'despensa debe ser un array'
  for (let i = 0; i < despensa.length; i++) {
    const d = despensa[i]
    if (!d || typeof d !== 'object') return `despensa[${i}] debe ser un objeto`
    if (typeof d.nombre !== 'string' || !d.nombre.trim()) return `despensa[${i}].nombre es obligatorio`
    if (typeof d.familia !== 'string' || !d.familia.trim()) return `despensa[${i}].familia es obligatorio`
    if (!ESTADOS_DESPENSA.includes(d.estado)) return `despensa[${i}].estado debe ser uno de: ${ESTADOS_DESPENSA.join(', ')}`
    if (d.caducidad != null && !/^\d{4}-\d{2}-\d{2}$/.test(d.caducidad)) return `despensa[${i}].caducidad debe ser una fecha YYYY-MM-DD`
    if (d.cantidad != null && (typeof d.cantidad !== 'number' || !Number.isFinite(d.cantidad) || d.cantidad < 0)) {
      return `despensa[${i}].cantidad debe ser un número >= 0`
    }
    if (d.cantidad != null && !UNIDADES_DESPENSA.includes(d.unidad)) {
      return `despensa[${i}].unidad debe ser una de: ${UNIDADES_DESPENSA.join(', ')}`
    }
  }
  return null
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

const VALIDADORES = {
  plan: validarPlan,
  despensa: validarDespensa,
  pendientes: validarPendientes,
  extras: validarExtras,
}

function validadorDe(campo) {
  const validar = VALIDADORES[campo]
  if (!validar) throw new Error(`Campo de estado sin validador: ${campo}`)
  return validar
}

export function leerCampo(campo) {
  validadorDe(campo)
  return async (req, res) => {
    res.json(await estadoService.getCampo(hogarDe(req), campo))
  }
}

export function guardarCampo(campo) {
  const validar = validadorDe(campo)
  return async (req, res) => {
    const error = validar(req.body)
    if (error) return res.status(400).json({ error })
    res.json(await estadoService.setCampo(hogarDe(req), campo, req.body))
  }
}
