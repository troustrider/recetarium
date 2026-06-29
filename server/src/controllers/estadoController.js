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
