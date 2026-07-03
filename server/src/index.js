import express from 'express'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express'
import swaggerSpec from './config/swagger.js'
import recetasRouter from './routes/recetas.js'
import estadoRouter from './routes/estado.js'
import extrasRouter from './routes/extras.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
app.use('/api/v1/recetas', recetasRouter)
app.use('/api/v1/plan', estadoRouter)
app.use('/api/v1/extras', extrasRouter)

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Error interno del servidor' })
})

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`)
    console.log(`Swagger UI disponible en http://localhost:${PORT}/api/docs`)
  })
}

export default app
