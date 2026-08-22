import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express'
import swaggerSpec from './config/swagger.js'
import { origenPermitido } from './lib/origenes.js'
import recetasRouter from './routes/recetas.js'
import { rutaEstado } from './routes/estado.js'
import sesionesRouter from './routes/sesiones.js'
import yoRouter from './routes/yo.js'
import authRouter from './routes/auth.js'

const app = express()

app.set('trust proxy', true)

app.use(
  cors({
    origin(origin, cb) {
      cb(null, !origin || origenPermitido(origin))
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
app.use('/api/v1/preferencias', rutaEstado('preferencias'))
app.use('/api/v1/admin', sesionesRouter)
app.use('/api/v1/yo', yoRouter)
app.use('/api/v1/auth', authRouter)

app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada' }))

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Error interno del servidor' })
})

export default app
