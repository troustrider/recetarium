import { Router } from 'express'
import sql from '../lib/db.js'

const router = Router()

router.get('/recetas', async (req, res, next) => {
  try {
    const recetas = await sql`
      SELECT r.id, r.nombre, r.precio_por_porcion, r.porciones, c.name AS categoria
      FROM recetas r
      INNER JOIN categories c ON r.category_id = c.id
      ORDER BY c.name, r.nombre
    `
    res.json(recetas)
  } catch (err) {
    next(err)
  }
})

router.post('/recetas', async (req, res, next) => {
  try {
    const { nombre, precio_por_porcion, porciones, category_id } = req.body
    const [receta] = await sql`
      INSERT INTO recetas (nombre, precio_por_porcion, porciones, category_id)
      VALUES (${nombre}, ${precio_por_porcion}, ${porciones}, ${category_id})
      RETURNING *
    `
    res.status(201).json(receta)
  } catch (err) {
    next(err)
  }
})

router.get('/categories', async (req, res, next) => {
  try {
    const result = await sql`SELECT id, name, description FROM categories ORDER BY name`
    res.json(result)
  } catch (err) {
    next(err)
  }
})

export default router
