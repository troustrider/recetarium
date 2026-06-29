import { Router } from 'express'
import * as c from '../controllers/estadoController.js'
import { requireKey } from '../lib/auth.js'

const router = Router()

/**
 * @swagger
 * /plan:
 *   get:
 *     summary: Obtener el plan semanal compartido
 *     tags: [Plan]
 *     responses:
 *       200:
 *         description: Plan semanal (array de entradas)
 *   put:
 *     summary: Guardar el plan semanal compartido
 *     tags: [Plan]
 *     responses:
 *       200:
 *         description: Plan guardado
 *       400:
 *         description: Plan inválido
 *       401:
 *         description: Clave incorrecta o ausente
 */
router.get('/', c.getPlan)
router.put('/', requireKey, c.putPlan)

export default router
