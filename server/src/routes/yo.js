import { Router } from 'express'
import sql from '../lib/db.js'
import { requireUser } from '../lib/auth.js'

const router = Router()

/**
 * @swagger
 * /yo:
 *   get:
 *     summary: Quién soy, según el token de sesión
 *     description: >
 *       Fuente de verdad de la sesión al arrancar la app. En la PWA de iOS la
 *       cookie del servicio de auth no sobrevive al cierre, así que el cliente
 *       guarda el token y pregunta aquí: este backend valida contra
 *       neon_auth.session, que está en su misma base de datos.
 *     tags: [Auth]
 *     responses:
 *       200: { description: Usuario, hogar y rol }
 *       401: { description: Sesión inválida o caducada }
 *       403: { description: Sin acceso }
 */
router.get('/', requireUser, (req, res) => res.json(req.usuario))

/**
 * @swagger
 * /yo/sesion:
 *   delete:
 *     summary: Cerrar sesión
 *     description: >
 *       Borra las sesiones del usuario, así que la revocación es inmediata. Se
 *       cierran todas y no solo la de este dispositivo, porque el cliente manda
 *       un JWT y no el identificador de la fila.
 *     tags: [Auth]
 *     responses:
 *       204: { description: Sesión cerrada }
 *       401: { description: Sesión inválida o caducada }
 */
router.delete('/sesion', requireUser, async (req, res) => {
  await sql`DELETE FROM neon_auth.session WHERE "userId" = ${req.usuario.id}`
  res.status(204).end()
})

export default router
