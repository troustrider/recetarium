import { Router } from 'express'
import { leerCampo, guardarCampo } from '../controllers/estadoController.js'
import { requireUser } from '../lib/auth.js'

/**
 * @swagger
 * /plan:
 *   get:
 *     summary: Obtener el plan semanal compartido
 *     tags: [Plan]
 *     responses:
 *       200: { description: Plan semanal (array de entradas) }
 *   put:
 *     summary: Guardar el plan semanal compartido
 *     tags: [Plan]
 *     responses:
 *       200: { description: Plan guardado, devuelto tal cual }
 *       400: { description: Plan inválido }
 *       401: { description: Sesión requerida }
 * /despensa:
 *   get:
 *     summary: Despensa del hogar (ingredientes en casa)
 *     tags: [Plan]
 *     responses:
 *       200: { description: Array de ingredientes con estado y caducidad opcional }
 *   put:
 *     summary: Guardar la despensa del hogar
 *     tags: [Plan]
 *     responses:
 *       200: { description: Guardado, devuelto tal cual }
 *       400: { description: Inválido }
 *       401: { description: Sesión requerida }
 * /extras:
 *   get:
 *     summary: Ítems manuales compartidos de la lista de la compra
 *     tags: [Plan]
 *     responses:
 *       200: { description: Array de ítems extra }
 *   put:
 *     summary: Guardar los ítems manuales
 *     tags: [Plan]
 *     responses:
 *       200: { description: Guardado, devuelto tal cual }
 *       400: { description: Inválido }
 *       401: { description: Sesión requerida }
 * /pendientes:
 *   get:
 *     summary: Recetas compradas pendientes de planificar
 *     tags: [Plan]
 *     responses:
 *       200: { description: Array de recetas pendientes }
 *   put:
 *     summary: Guardar las recetas pendientes de planificar
 *     tags: [Plan]
 *     responses:
 *       200: { description: Guardado, devuelto tal cual }
 *       400: { description: Inválido }
 *       401: { description: Sesión requerida }
 * /preferencias:
 *   get:
 *     summary: Cómo quiere comer el hogar (prioridades, cocinas favoritas, límites)
 *     tags: [Plan]
 *     responses:
 *       200: { description: Objeto de preferencias; {} si el hogar no las ha tocado }
 *   put:
 *     summary: Guardar las preferencias del hogar
 *     tags: [Plan]
 *     responses:
 *       200: { description: Guardado, devuelto tal cual }
 *       400: { description: Inválido }
 *       401: { description: Sesión requerida }
 */
export function rutaEstado(campo) {
  const router = Router()
  router.get('/', requireUser, leerCampo(campo))
  router.put('/', requireUser, guardarCampo(campo))
  return router
}

export default rutaEstado
