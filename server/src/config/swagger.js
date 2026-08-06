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
            precioPorPorcion: { type: 'number', example: 2.5 },
            porciones: { type: 'integer', example: 2 },
            calorias: { type: 'integer', example: 520 },
            proteinas: { type: 'number', example: 38.5 },
            carbohidratos: { type: 'number', example: 45 },
            grasas: { type: 'number', example: 18 },
            hierro: { type: 'number', example: 4.6, readOnly: true, description: 'mg/porción. Lo calcula el servidor desde los ingredientes.' },
            sinGluten: { type: 'boolean', nullable: true, example: false, readOnly: true, description: 'null si algún ingrediente no tiene ficha: ahí no se puede afirmar que no lleve.' },
            micros: {
              type: 'object', readOnly: true,
              description: 'Micronutrientes por porción, calculados desde los ingredientes.',
              properties: {
                fibra: { type: 'number', example: 6.2 },
                azucares: { type: 'number', example: 8.1 },
                saturadas: { type: 'number', example: 4.3 },
                sal: { type: 'number', example: 1.94, description: 'La de los ingredientes; no cuenta la añadida al cocinar.' },
                hierroHemo: { type: 'number', example: 1.8, description: 'Parte del hierro que es hemo (carne, pescado).' },
                vitaminaC: { type: 'integer', example: 42 },
                calcio: { type: 'integer', example: 180 },
                b12: { type: 'number', example: 1.4 },
                folato: { type: 'integer', example: 96 },
                gluten: {
                  type: 'object', nullable: true,
                  properties: {
                    fuentes: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          nombre: { type: 'string', example: 'salsa de soja' },
                          certeza: { type: 'string', enum: ['si', 'depende'] },
                          sustituto: { type: 'string', nullable: true, example: 'tamari sin gluten' },
                        },
                      },
                    },
                    evitable: { type: 'boolean', example: true },
                  },
                },
                estimadoDe: { type: 'string', enum: ['completo', 'parcial'] },
              },
            },
            tipo: { type: 'string', enum: ['principal', 'postre', 'desayuno', 'entrante'], example: 'principal' },
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
            precioPorPorcion: { type: 'number' },
            porciones: { type: 'integer' },
            calorias: { type: 'integer' },
            proteinas: { type: 'number' },
            carbohidratos: { type: 'number' },
            grasas: { type: 'number' },
            tipo: { type: 'string', enum: ['principal', 'postre', 'desayuno', 'entrante'] },
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
