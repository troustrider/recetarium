import swaggerJsdoc from 'swagger-jsdoc'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Recetarium API',
      version: '1.0.0',
      description: 'API REST para gestión de recetas personales. Permite crear, editar, eliminar y marcar recetas como favoritas.',
    },
    servers: [
      { url: 'http://localhost:3001/api/v1', description: 'Desarrollo local' },
      { url: 'https://recetarium-one.vercel.app/api/v1', description: 'Producción (Vercel)' },
    ],
    components: {
      schemas: {
        Ingrediente: {
          type: 'object',
          required: ['nombre', 'cantidad', 'unidad', 'familia'],
          properties: {
            nombre: { type: 'string', example: 'Huevo' },
            cantidad: { type: 'number', example: 4 },
            unidad: { type: 'string', example: 'ud' },
            familia: { type: 'string', example: 'lácteos' },
          },
        },
        Receta: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: 'a1b2c3d4-...' },
            nombre: { type: 'string', example: 'Tortilla de patatas' },
            categoria: { type: 'string', example: 'Española' },
            sabor: { type: 'string', enum: ['salado', 'dulce', 'amargo', 'umami', 'acido'] },
            tiempoPreparacion: { type: 'integer', minimum: 1, example: 30 },
            favorita: { type: 'boolean', example: false },
            imagen: { type: 'string', format: 'uri', example: 'https://images.unsplash.com/...' },
            ingredientes: { type: 'array', items: { $ref: '#/components/schemas/Ingrediente' } },
            pasos: { type: 'array', items: { type: 'string' }, example: ['Batir los huevos'] },
          },
        },
        RecetaInput: {
          type: 'object',
          required: ['nombre', 'sabor', 'tiempoPreparacion', 'ingredientes', 'pasos'],
          properties: {
            nombre: { type: 'string' },
            categoria: { type: 'string' },
            sabor: { type: 'string', enum: ['salado', 'dulce', 'amargo', 'umami', 'acido'] },
            tiempoPreparacion: { type: 'integer', minimum: 1 },
            imagen: { type: 'string', format: 'uri' },
            ingredientes: { type: 'array', items: { $ref: '#/components/schemas/Ingrediente' } },
            pasos: { type: 'array', items: { type: 'string' } },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            errores: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
  },
  apis: ['./server/src/routes/*.js'],
}

export default swaggerJsdoc(options)
