const fs = require('fs')
const path = require('path')
const swaggerSpec = require('../src/config/swagger')

const outputPath = path.resolve(__dirname, '../../docs/swagger.json')
fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2))
console.log(`swagger.json generado en ${outputPath}`)
