import { Router } from 'express'
import { requireUser } from '../lib/auth.js'
import { borrarSesionesDe } from '../services/authService.js'

const router = Router()

/**
 * @swagger
 * /yo:
 *   get:
 *     summary: Quién soy, según el token de sesión
 *     description: >
 *       Fuente de verdad de la sesión al arrancar la app: el cliente guarda el
 *       token que le dio nuestro OAuth y pregunta aquí, que valida contra la
 *       tabla sesiones.
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
  await borrarSesionesDe(req.usuario.id)
  res.status(204).end()
})

export default router
