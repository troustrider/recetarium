import { Router } from 'express'
import * as c from '../controllers/sesionesController.js'
import { requireUser, requireAdmin } from '../lib/auth.js'

const router = Router()

/**
 * @swagger
 * /admin/sesiones:
 *   get:
 *     summary: Quién ha iniciado sesión, desde qué IP y con qué dispositivo
 *     description: Solo administradores. Devuelve sesiones recientes, resumen por usuario e IPs vistas por primera vez.
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: limite
 *         schema: { type: integer, default: 100, maximum: 500 }
 *       - in: query
 *         name: dias
 *         schema: { type: integer, default: 7, maximum: 90 }
 *     responses:
 *       200: { description: Sesiones, resumen por usuario e IPs nuevas }
 *       401: { description: Sesión requerida }
 *       403: { description: Solo para administradores }
 */
router.get('/sesiones', requireUser, requireAdmin, c.getSesiones)

export default router
