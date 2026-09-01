import { Router } from 'express'
import * as guarnicionesService from '../services/guarnicionesService.js'
import { requireUser } from '../lib/auth.js'

const router = Router()

/**
 * @swagger
 * /guarniciones:
 *   get:
 *     summary: Catálogo de guarniciones disponibles para el hogar
 *     tags: [Guarniciones]
 *     responses:
 *       200:
 *         description: Guarniciones comunes más las propias del hogar
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Guarnicion'
 */
router.get('/', requireUser, async (req, res, next) => {
  try {
    res.json(await guarnicionesService.getAll(req.usuario.hogarId))
  } catch (err) {
    next(err)
  }
})

export default router
