import { Router } from 'express'
import * as c from '../controllers/sesionesController.js'
import * as i from '../controllers/invitadosController.js'
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

/**
 * @swagger
 * /admin/invitados:
 *   get:
 *     summary: Lista blanca de acceso, y los hogares disponibles
 *     tags: [Admin]
 *     responses:
 *       200: { description: Invitaciones y hogares }
 *       403: { description: Solo para administradores }
 *   post:
 *     summary: Invitar un correo
 *     description: hogarId nulo crea un hogar propio en el primer inicio de sesión.
 *     tags: [Admin]
 *     responses:
 *       201: { description: Invitación guardada }
 *       400: { description: Correo, rol u hogar inválidos }
 *       403: { description: Solo para administradores }
 * /admin/invitados/{email}:
 *   delete:
 *     summary: Retirar una invitación que nadie haya usado
 *     tags: [Admin]
 *     responses:
 *       204: { description: Retirada }
 *       404: { description: No hay invitación pendiente para ese correo }
 *       403: { description: Solo para administradores }
 */
router.get('/invitados', requireUser, requireAdmin, i.getInvitados)
router.post('/invitados', requireUser, requireAdmin, i.postInvitado)
router.delete('/invitados/:email', requireUser, requireAdmin, i.deleteInvitado)

export default router
