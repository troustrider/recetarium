import { Router } from 'express'
import * as c from '../controllers/estadoController.js'
import { requireUser } from '../lib/auth.js'

const router = Router()

/**
 * @swagger
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
 *       200: { description: Guardado }
 *       400: { description: Inválido }
 *       401: { description: Sesión requerida }
 */
router.get('/', requireUser, c.getPendientes)
router.put('/', requireUser, c.putPendientes)

export default router
