import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express'
import swaggerSpec from './config/swagger.js'
import recetasRouter from './routes/recetas.js'
import { rutaEstado } from './routes/estado.js'
import sesionesRouter from './routes/sesiones.js'
import yoRouter from './routes/yo.js'

const app = express()

const ORIGENES = (process.env.ORIGENES_PERMITIDOS ?? '')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean)

const LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true)
      const limpio = origin.replace(/\/$/, '')
      cb(null, ORIGENES.includes(limpio) || (ORIGENES.length === 0 && LOCAL.test(limpio)))
    },
  })
)
app.use(express.json())

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
app.use('/api/v1/recetas', recetasRouter)
app.use('/api/v1/plan', rutaEstado('plan'))
app.use('/api/v1/extras', rutaEstado('extras'))
app.use('/api/v1/despensa', rutaEstado('despensa'))
app.use('/api/v1/pendientes', rutaEstado('pendientes'))
app.use('/api/v1/admin', sesionesRouter)
app.use('/api/v1/yo', yoRouter)

app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada' }))

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Error interno del servidor' })
})

export default app
