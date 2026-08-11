import { Router } from 'express'
import * as c from '../controllers/estadoController.js'
import { requireUser } from '../lib/auth.js'

const router = Router()

/**
 * @swagger
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
 *       200: { description: Guardado }
 *       400: { description: Inválido }
 *       401: { description: Sesión requerida }
 */
router.get('/', requireUser, c.getDespensa)
router.put('/', requireUser, c.putDespensa)

export default router
