import { Router } from 'express'
import * as c from '../controllers/estadoController.js'
import { requireKey } from '../lib/auth.js'

const router = Router()

/**
 * @swagger
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
 *       200: { description: Guardado }
 *       400: { description: Inválido }
 *       401: { description: Clave incorrecta o ausente }
 */
router.get('/', c.getExtras)
router.put('/', requireKey, c.putExtras)

export default router
