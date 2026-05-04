const { Router } = require('express')
const c = require('../controllers/recetasController')

const router = Router()

router.get('/', c.getAll)
router.get('/:id', c.getById)
router.post('/', c.create)
router.put('/:id', c.update)
router.patch('/:id/favorita', c.toggleFavorita)
router.delete('/:id', c.remove)

module.exports = router
