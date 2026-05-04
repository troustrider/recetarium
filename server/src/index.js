const express = require('express')
const cors = require('cors')
const recetasRouter = require('./routes/recetas')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.use('/api/v1/recetas', recetasRouter)

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Error interno del servidor' })
})

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`)
  })
}

module.exports = app
