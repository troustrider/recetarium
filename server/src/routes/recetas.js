import { Router } from 'express'
import * as c from '../controllers/recetasController.js'
import { requireUser } from '../lib/auth.js'

const router = Router()

/**
 * @swagger
 * /recetas:
 *   get:
 *     summary: Listar todas las recetas
 *     tags: [Recetas]
 *     parameters:
 *       - in: query
 *         name: categoria
 *         schema: { type: string }
 *         description: Filtrar por categoría
 *       - in: query
 *         name: sabor
 *         schema: { type: string, enum: [salado, dulce, amargo, umami, acido] }
 *         description: Filtrar por sabor
 *     responses:
 *       200:
 *         description: Lista de recetas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Receta'
 */
router.get('/', c.getAll)

/**
 * @swagger
 * /recetas/{id}:
 *   get:
 *     summary: Obtener una receta por ID
 *     tags: [Recetas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Receta encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Receta'
 *       404:
 *         description: Receta no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', c.getById)

/**
 * @swagger
 * /recetas:
 *   post:
 *     summary: Crear una nueva receta
 *     tags: [Recetas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RecetaInput'
 *     responses:
 *       201:
 *         description: Receta creada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Receta'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', requireUser, c.create)

/**
 * @swagger
 * /recetas/{id}:
 *   put:
 *     summary: Actualizar una receta
 *     tags: [Recetas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RecetaInput'
 *     responses:
 *       200:
 *         description: Receta actualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Receta'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Receta no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', requireUser, c.update)

/**
 * @swagger
 * /recetas/{id}/favorita:
 *   patch:
 *     summary: Alternar el estado de favorita
 *     tags: [Recetas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Receta con favorita actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Receta'
 *       404:
 *         description: Receta no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/:id/favorita', requireUser, c.toggleFavorita)

/**
 * @swagger
 * /recetas/{id}:
 *   delete:
 *     summary: Eliminar una receta (borrado lógico, se puede restaurar)
 *     tags: [Recetas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Eliminada correctamente
 *       404:
 *         description: Receta no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', requireUser, c.remove)

/**
 * @swagger
 * /recetas/{id}/restaurar:
 *   post:
 *     summary: Devolver al catálogo una receta borrada, con su mismo id
 *     tags: [Recetas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Receta restaurada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Receta'
 *       404:
 *         description: No existe o no estaba borrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:id/restaurar', requireUser, c.restore)

export default router
