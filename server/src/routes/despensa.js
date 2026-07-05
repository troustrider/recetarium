import { Router } from 'express'
import * as c from '../controllers/estadoController.js'
import { requireKey } from '../lib/auth.js'

const router = Router()

/**
 * @swagger
 * /despensa:
 *   get:
 *     summary: Despensa compartida (ingredientes en casa)
 *     tags: [Plan]
 *     responses:
 *       200: { description: Array de ingredientes con estado y caducidad opcional }
 *   put:
 *     summary: Guardar la despensa compartida
 *     tags: [Plan]
 *     responses:
 *       200: { description: Guardado }
 *       400: { description: Inválido }
 *       401: { description: Clave incorrecta o ausente }
 */
router.get('/', c.getDespensa)
router.put('/', requireKey, c.putDespensa)

export default router
