import { Router } from 'express'
import * as c from '../controllers/estadoController.js'
import { requireKey } from '../lib/auth.js'

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
 *       401: { description: Clave incorrecta o ausente }
 */
router.get('/', c.getPendientes)
router.put('/', requireKey, c.putPendientes)

export default router
