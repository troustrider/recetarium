import { Router } from 'express'
import * as c from '../controllers/authController.js'

const router = Router()

/**
 * @swagger
 * /auth/google/inicio:
 *   get:
 *     summary: Empieza el acceso con Google
 *     description: Redirige a Google. El destino tiene que ser un origen de confianza; al volver, la sesión llega en el fragmento de la URL.
 *     tags: [Acceso]
 *     parameters:
 *       - in: query
 *         name: destino
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       302: { description: Redirección a Google }
 *       400: { description: Destino no permitido }
 *       503: { description: Falta configurar el acceso con Google }
 */
router.get('/google/inicio', c.inicio)

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     summary: Vuelta de Google
 *     description: Canjea el código, crea la sesión y devuelve al destino con el token en el fragmento.
 *     tags: [Acceso]
 *     responses:
 *       302: { description: Redirección al destino }
 *       400: { description: Estado no válido o caducado }
 */
router.get('/google/callback', c.callback)

export default router
