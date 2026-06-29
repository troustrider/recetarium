// Seed idempotente: rellena macros de las recetas existentes (backfill) e
// inserta recetas nuevas que aún no estén (match por nombre, sin distinguir
// mayúsculas/acentos). Re-ejecutable sin duplicar.
//
//   node --env-file=.env server/seed-recetas.mjs
//   (o)  DATABASE_URL=... node server/seed-recetas.mjs
//
// Reglas de las nuevas: fácil, barato, rápido y >= 30 g de proteína por
// porción (salvo el bowl de avena, que también ronda los 30). Macros por porción.

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

// — Backfill de las 20 existentes (macros por porción, estimados) —
const BACKFILL = [
  ['a1b2c3d4-0012-4000-8000-000000000012', 280, 4, 32, 16],   // Brownies
  ['a1b2c3d4-0009-4000-8000-000000000009', 380, 14, 34, 20],  // Croquetas jamón
  ['a1b2c3d4-0020-4000-8000-000000000020', 340, 13, 45, 12],  // Curry garbanzos
  ['a1b2c3d4-0010-4000-8000-000000000010', 290, 9, 14, 23],   // Ensalada griega
  ['a1b2c3d4-0008-4000-8000-000000000008', 520, 28, 38, 28],  // Fabada
  ['a1b2c3d4-0003-4000-8000-000000000003', 300, 14, 32, 12],  // Gyozas
  ['a1b2c3d4-0011-4000-8000-000000000011', 650, 38, 40, 38],  // Hamburguesa smash
  ['a1b2c3d4-0016-4000-8000-000000000016', 250, 6, 34, 10],   // Leche frita
  ['a1b2c3d4-0013-4000-8000-000000000013', 110, 2, 18, 4],    // Macarons
  ['a1b2c3d4-0015-4000-8000-000000000015', 320, 6, 28, 21],   // Mousse chocolate
  ['a1b2c3d4-0004-4000-8000-000000000004', 520, 26, 62, 16],  // Pad Thai
  ['a1b2c3d4-0001-4000-8000-000000000001', 480, 26, 58, 14],  // Paella
  ['a1b2c3d4-0019-4000-8000-000000000019', 380, 16, 46, 14],  // Pizza margherita
  ['a1b2c3d4-0002-4000-8000-000000000002', 560, 34, 62, 16],  // Ramen pollo
  ['a1b2c3d4-0006-4000-8000-000000000006', 420, 11, 58, 14],  // Risotto setas
  ['a1b2c3d4-0005-4000-8000-000000000005', 120, 9, 10, 5],    // Sopa miso
  ['a1b2c3d4-0018-4000-8000-000000000018', 430, 20, 68, 8],   // Sushi salmón
  ['a1b2c3d4-0017-4000-8000-000000000017', 410, 26, 38, 16],  // Tacos pastor
  ['a1b2c3d4-0014-4000-8000-000000000014', 380, 5, 44, 21],   // Tarta zanahoria
  ['a1b2c3d4-0007-4000-8000-000000000007', 360, 7, 34, 22],   // Tiramisú
]

const ing = (nombre, cantidad, unidad, familia) => ({ nombre, cantidad, unidad, familia })

// — Recetas nuevas —
const NUEVAS = [
  // ----- Las 7 ya diseñadas -----
  {
    nombre: 'Shakshuka', categoria: 'mediterranea', sabor: 'salado', tiempoPreparacion: 25,
    precioPorPorcion: 2.2, porciones: 2, calorias: 420, proteinas: 31, carbohidratos: 18, grasas: 26,
    ingredientes: [
      ing('huevos', 4, 'ud', 'huevos'), ing('queso feta', 80, 'g', 'lacteos'),
      ing('tomate triturado', 400, 'g', 'verduras'), ing('cebolla', 1, 'ud', 'verduras'),
      ing('pimiento rojo', 1, 'ud', 'verduras'), ing('comino', 1, 'cucharadita', 'condimentos'),
      ing('pimentón', 1, 'cucharadita', 'condimentos'), ing('aceite de oliva', 2, 'cucharada', 'condimentos'),
    ],
    pasos: [
      'Pocha la cebolla y el pimiento en aceite 6-7 min.',
      'Añade tomate, comino y pimentón; cuece 8 min hasta espesar.',
      'Haz 4 huecos y casca un huevo en cada uno.',
      'Tapa y cuece 5-6 min hasta que cuaje la clara.',
      'Desmiga el feta por encima y sirve.',
    ],
  },
  {
    nombre: 'Pollo teriyaki', categoria: 'japonesa', sabor: 'umami', tiempoPreparacion: 20,
    precioPorPorcion: 2.8, porciones: 2, calorias: 540, proteinas: 42, carbohidratos: 55, grasas: 12,
    ingredientes: [
      ing('contramuslos de pollo deshuesados', 350, 'g', 'carnes'), ing('arroz', 200, 'g', 'cereales'),
      ing('salsa de soja', 3, 'cucharada', 'salsas'), ing('mirin', 2, 'cucharada', 'salsas'),
      ing('azúcar', 1, 'cucharada', 'condimentos'), ing('jengibre', 1, 'cucharadita', 'condimentos'),
      ing('cebolleta', 1, 'ud', 'verduras'),
    ],
    pasos: [
      'Cuece el arroz.',
      'Dora el pollo en una sartén 5 min por cada lado.',
      'Añade soja, mirin, azúcar y jengibre; glasea 3-4 min.',
      'Corta en tiras y sirve sobre el arroz con cebolleta.',
    ],
  },
  {
    nombre: 'Pollo al miso', categoria: 'japonesa', sabor: 'umami', tiempoPreparacion: 25,
    precioPorPorcion: 2.9, porciones: 2, calorias: 520, proteinas: 41, carbohidratos: 52, grasas: 13,
    ingredientes: [
      ing('pechuga de pollo', 350, 'g', 'carnes'), ing('arroz', 200, 'g', 'cereales'),
      ing('pasta de miso', 2, 'cucharada', 'salsas'), ing('salsa de soja', 1, 'cucharada', 'salsas'),
      ing('mirin', 1, 'cucharada', 'salsas'), ing('ajo', 1, 'diente', 'verduras'),
      ing('brócoli', 150, 'g', 'verduras'),
    ],
    pasos: [
      'Mezcla miso, soja, mirin y ajo; marina el pollo 10 min.',
      'Cuece el arroz y el brócoli al vapor.',
      'Dora el pollo marinado 6-7 min por lado.',
      'Corta y sirve con el arroz y el brócoli.',
    ],
  },
  {
    nombre: 'Pollo griego al limón y orégano', categoria: 'mediterranea', sabor: 'salado', tiempoPreparacion: 30,
    precioPorPorcion: 2.6, porciones: 2, calorias: 510, proteinas: 44, carbohidratos: 35, grasas: 22,
    ingredientes: [
      ing('contramuslos de pollo', 400, 'g', 'carnes'), ing('patata', 300, 'g', 'verduras'),
      ing('limón', 1, 'ud', 'frutas'), ing('orégano', 1, 'cucharada', 'condimentos'),
      ing('ajo', 2, 'diente', 'verduras'), ing('aceite de oliva', 2, 'cucharada', 'condimentos'),
    ],
    pasos: [
      'Mezcla zumo de limón, ajo, orégano y aceite.',
      'Marina el pollo y las patatas en trozos.',
      'Hornea a 200°C 25-30 min removiendo a mitad.',
      'Sirve con el jugo de la bandeja.',
    ],
  },
  {
    nombre: 'Pollo turco especiado', categoria: 'turca', sabor: 'salado', tiempoPreparacion: 30,
    precioPorPorcion: 2.7, porciones: 2, calorias: 480, proteinas: 45, carbohidratos: 22, grasas: 24,
    ingredientes: [
      ing('pechuga de pollo', 400, 'g', 'carnes'), ing('yogur griego (kwark)', 150, 'g', 'lacteos'),
      ing('pimentón', 1, 'cucharadita', 'condimentos'), ing('comino', 1, 'cucharadita', 'condimentos'),
      ing('ajo', 2, 'diente', 'verduras'), ing('limón', 0.5, 'ud', 'frutas'),
    ],
    pasos: [
      'Mezcla yogur, especias, ajo y limón.',
      'Marina el pollo en dados 15 min.',
      'Ensarta o saltea a fuego fuerte 8-10 min.',
      'Sirve con el resto del yogur como salsa.',
    ],
  },
  {
    nombre: 'Atún oriental con cúscus perla', categoria: 'fusion', sabor: 'umami', tiempoPreparacion: 15,
    precioPorPorcion: 2.4, porciones: 2, calorias: 470, proteinas: 38, carbohidratos: 50, grasas: 12,
    ingredientes: [
      ing('atún en lata al natural', 240, 'g', 'pescados'), ing('cúscus perla', 160, 'g', 'cereales'),
      ing('salsa de soja', 2, 'cucharada', 'salsas'), ing('aceite de sésamo', 1, 'cucharadita', 'condimentos'),
      ing('cebolleta', 1, 'ud', 'verduras'), ing('guisantes', 80, 'g', 'verduras'),
    ],
    pasos: [
      'Cuece el cúscus perla con los guisantes 8 min.',
      'Escurre el atún y mézclalo con soja y sésamo.',
      'Combina todo y remata con cebolleta.',
    ],
  },
  {
    nombre: 'Bowl de avena proteico', categoria: 'desayuno', sabor: 'dulce', tiempoPreparacion: 5,
    precioPorPorcion: 1.4, porciones: 1, calorias: 460, proteinas: 34, carbohidratos: 48, grasas: 14,
    ingredientes: [
      ing('kwark (quark)', 200, 'g', 'lacteos'), ing('copos de avena', 50, 'g', 'cereales'),
      ing('pindakaas (crema de cacahuete)', 1, 'cucharada', 'condimentos'), ing('plátano', 1, 'ud', 'frutas'),
      ing('canela', 1, 'pizca', 'condimentos'),
    ],
    pasos: [
      'Mezcla el kwark con la avena.',
      'Añade plátano en rodajas y la crema de cacahuete.',
      'Espolvorea canela y sirve.',
    ],
  },

  // ----- Japón -----
  {
    nombre: 'Gyudon', categoria: 'japonesa', sabor: 'umami', tiempoPreparacion: 20,
    precioPorPorcion: 2.8, porciones: 2, calorias: 560, proteinas: 34, carbohidratos: 64, grasas: 16,
    ingredientes: [
      ing('ternera en lonchas finas', 300, 'g', 'carnes'), ing('arroz', 200, 'g', 'cereales'),
      ing('cebolla', 1, 'ud', 'verduras'), ing('salsa de soja', 3, 'cucharada', 'salsas'),
      ing('mirin', 2, 'cucharada', 'salsas'), ing('azúcar', 1, 'cucharada', 'condimentos'),
    ],
    pasos: [
      'Cuece el arroz.',
      'Pocha la cebolla en juliana con soja, mirin y azúcar.',
      'Añade la ternera y cuece 4-5 min.',
      'Sirve sobre el arroz.',
    ],
  },
  {
    nombre: 'Oyakodon', categoria: 'japonesa', sabor: 'umami', tiempoPreparacion: 20,
    precioPorPorcion: 2.3, porciones: 2, calorias: 540, proteinas: 36, carbohidratos: 62, grasas: 14,
    ingredientes: [
      ing('contramuslos de pollo', 250, 'g', 'carnes'), ing('huevos', 3, 'ud', 'huevos'),
      ing('arroz', 200, 'g', 'cereales'), ing('cebolla', 1, 'ud', 'verduras'),
      ing('salsa de soja', 3, 'cucharada', 'salsas'), ing('mirin', 2, 'cucharada', 'salsas'),
    ],
    pasos: [
      'Cuece el arroz.',
      'Cuece el pollo y la cebolla con soja y mirin 6 min.',
      'Vierte el huevo batido y tapa 2 min.',
      'Sirve sobre el arroz.',
    ],
  },
  {
    nombre: 'Katsudon', categoria: 'japonesa', sabor: 'umami', tiempoPreparacion: 25,
    precioPorPorcion: 3.0, porciones: 2, calorias: 680, proteinas: 38, carbohidratos: 72, grasas: 24,
    ingredientes: [
      ing('lomo de cerdo', 300, 'g', 'carnes'), ing('pan rallado panko', 60, 'g', 'cereales'),
      ing('huevos', 3, 'ud', 'huevos'), ing('arroz', 200, 'g', 'cereales'),
      ing('cebolla', 1, 'ud', 'verduras'), ing('salsa de soja', 3, 'cucharada', 'salsas'),
    ],
    pasos: [
      'Empana el cerdo en panko y fríe hasta dorar.',
      'Cuece la cebolla con soja y un poco de agua.',
      'Añade el cerdo en tiras y el huevo batido; tapa 2 min.',
      'Sirve sobre arroz.',
    ],
  },
  {
    nombre: 'Salmón teriyaki', categoria: 'japonesa', sabor: 'umami', tiempoPreparacion: 20,
    precioPorPorcion: 3.6, porciones: 2, calorias: 560, proteinas: 38, carbohidratos: 50, grasas: 20,
    ingredientes: [
      ing('lomos de salmón', 300, 'g', 'pescados'), ing('arroz', 200, 'g', 'cereales'),
      ing('salsa de soja', 3, 'cucharada', 'salsas'), ing('mirin', 2, 'cucharada', 'salsas'),
      ing('azúcar', 1, 'cucharada', 'condimentos'), ing('brócoli', 150, 'g', 'verduras'),
    ],
    pasos: [
      'Cuece arroz y brócoli.',
      'Marca el salmón por ambos lados.',
      'Glasea con soja, mirin y azúcar 3 min.',
      'Sirve con el arroz y el brócoli.',
    ],
  },
  {
    nombre: 'Yakitori de pollo', categoria: 'japonesa', sabor: 'umami', tiempoPreparacion: 25,
    precioPorPorcion: 2.5, porciones: 2, calorias: 460, proteinas: 40, carbohidratos: 30, grasas: 18,
    ingredientes: [
      ing('contramuslos de pollo', 400, 'g', 'carnes'), ing('cebolleta', 2, 'ud', 'verduras'),
      ing('salsa de soja', 3, 'cucharada', 'salsas'), ing('mirin', 2, 'cucharada', 'salsas'),
      ing('azúcar', 1, 'cucharada', 'condimentos'),
    ],
    pasos: [
      'Corta el pollo y la cebolleta en trozos y ensarta.',
      'Reduce soja, mirin y azúcar hasta jarabe.',
      'Asa las brochetas pincelando con la salsa 10 min.',
    ],
  },
  {
    nombre: 'Tofu teriyaki', categoria: 'japonesa', sabor: 'umami', tiempoPreparacion: 20,
    precioPorPorcion: 2.0, porciones: 2, calorias: 440, proteinas: 30, carbohidratos: 48, grasas: 14,
    ingredientes: [
      ing('tofu firme', 400, 'g', 'legumbres'), ing('arroz', 200, 'g', 'cereales'),
      ing('salsa de soja', 3, 'cucharada', 'salsas'), ing('mirin', 2, 'cucharada', 'salsas'),
      ing('maicena', 1, 'cucharada', 'condimentos'), ing('cebolleta', 1, 'ud', 'verduras'),
    ],
    pasos: [
      'Cuece el arroz.',
      'Reboza el tofu en dados con maicena y dóralo.',
      'Glasea con soja y mirin 3 min.',
      'Sirve sobre arroz con cebolleta.',
    ],
  },

  // ----- China -----
  {
    nombre: 'Mapo tofu', categoria: 'china', sabor: 'umami', tiempoPreparacion: 25,
    precioPorPorcion: 2.4, porciones: 2, calorias: 520, proteinas: 33, carbohidratos: 46, grasas: 22,
    ingredientes: [
      ing('tofu firme', 300, 'g', 'legumbres'), ing('carne picada de cerdo', 150, 'g', 'carnes'),
      ing('arroz', 200, 'g', 'cereales'), ing('pasta de judía picante (doubanjiang)', 1, 'cucharada', 'salsas'),
      ing('salsa de soja', 2, 'cucharada', 'salsas'), ing('ajo', 2, 'diente', 'verduras'),
    ],
    pasos: [
      'Cuece el arroz.',
      'Sofríe la carne con ajo y la pasta picante.',
      'Añade el tofu en dados y soja con un poco de agua.',
      'Cuece 5 min y sirve sobre arroz.',
    ],
  },
  {
    nombre: 'Pollo kung pao', categoria: 'china', sabor: 'salado', tiempoPreparacion: 25,
    precioPorPorcion: 2.7, porciones: 2, calorias: 540, proteinas: 40, carbohidratos: 48, grasas: 20,
    ingredientes: [
      ing('pechuga de pollo', 350, 'g', 'carnes'), ing('arroz', 200, 'g', 'cereales'),
      ing('cacahuetes', 50, 'g', 'condimentos'), ing('salsa de soja', 3, 'cucharada', 'salsas'),
      ing('vinagre de arroz', 1, 'cucharada', 'condimentos'), ing('pimiento', 1, 'ud', 'verduras'),
    ],
    pasos: [
      'Cuece el arroz.',
      'Saltea el pollo en dados a fuego fuerte.',
      'Añade pimiento, soja y vinagre; saltea 3 min.',
      'Remata con cacahuetes y sirve.',
    ],
  },
  {
    nombre: 'Ternera con brócoli', categoria: 'china', sabor: 'umami', tiempoPreparacion: 20,
    precioPorPorcion: 3.2, porciones: 2, calorias: 520, proteinas: 38, carbohidratos: 46, grasas: 18,
    ingredientes: [
      ing('ternera en tiras', 300, 'g', 'carnes'), ing('brócoli', 250, 'g', 'verduras'),
      ing('arroz', 200, 'g', 'cereales'), ing('salsa de soja', 3, 'cucharada', 'salsas'),
      ing('ajo', 2, 'diente', 'verduras'), ing('maicena', 1, 'cucharada', 'condimentos'),
    ],
    pasos: [
      'Cuece el arroz.',
      'Saltea la ternera a fuego fuerte y reserva.',
      'Saltea el brócoli y el ajo 3 min.',
      'Devuelve la ternera con soja y maicena disuelta; liga y sirve.',
    ],
  },
  {
    nombre: 'Arroz frito con huevo y pollo', categoria: 'china', sabor: 'salado', tiempoPreparacion: 20,
    precioPorPorcion: 2.1, porciones: 2, calorias: 580, proteinas: 34, carbohidratos: 64, grasas: 18,
    ingredientes: [
      ing('arroz cocido del día anterior', 350, 'g', 'cereales'), ing('pechuga de pollo', 250, 'g', 'carnes'),
      ing('huevos', 2, 'ud', 'huevos'), ing('guisantes', 80, 'g', 'verduras'),
      ing('salsa de soja', 3, 'cucharada', 'salsas'), ing('cebolleta', 1, 'ud', 'verduras'),
    ],
    pasos: [
      'Saltea el pollo en dados y reserva.',
      'Cuaja el huevo batido y reserva.',
      'Saltea el arroz con guisantes y soja a fuego fuerte.',
      'Incorpora pollo y huevo; remata con cebolleta.',
    ],
  },

  // ----- Corea -----
  {
    nombre: 'Bibimbap', categoria: 'coreana', sabor: 'salado', tiempoPreparacion: 30,
    precioPorPorcion: 2.9, porciones: 2, calorias: 600, proteinas: 33, carbohidratos: 66, grasas: 20,
    ingredientes: [
      ing('ternera picada', 200, 'g', 'carnes'), ing('arroz', 200, 'g', 'cereales'),
      ing('huevos', 2, 'ud', 'huevos'), ing('zanahoria', 1, 'ud', 'verduras'),
      ing('espinacas', 100, 'g', 'verduras'), ing('salsa gochujang', 2, 'cucharada', 'salsas'),
    ],
    pasos: [
      'Cuece el arroz.',
      'Saltea por separado ternera, zanahoria y espinacas.',
      'Fríe un huevo por persona.',
      'Monta el bol con arroz, verduras, carne, huevo y gochujang.',
    ],
  },
  {
    nombre: 'Bulgogi', categoria: 'coreana', sabor: 'umami', tiempoPreparacion: 25,
    precioPorPorcion: 3.1, porciones: 2, calorias: 560, proteinas: 37, carbohidratos: 52, grasas: 20,
    ingredientes: [
      ing('ternera en lonchas finas', 300, 'g', 'carnes'), ing('arroz', 200, 'g', 'cereales'),
      ing('salsa de soja', 3, 'cucharada', 'salsas'), ing('azúcar', 1, 'cucharada', 'condimentos'),
      ing('pera', 0.5, 'ud', 'frutas'), ing('ajo', 2, 'diente', 'verduras'),
    ],
    pasos: [
      'Tritura pera, soja, azúcar y ajo; marina la carne 15 min.',
      'Cuece el arroz.',
      'Saltea la ternera a fuego fuerte 4 min.',
      'Sirve con el arroz.',
    ],
  },
  {
    nombre: 'Sundubu jjigae (estofado de tofu)', categoria: 'coreana', sabor: 'salado', tiempoPreparacion: 25,
    precioPorPorcion: 2.3, porciones: 2, calorias: 420, proteinas: 31, carbohidratos: 30, grasas: 20,
    ingredientes: [
      ing('tofu sedoso', 300, 'g', 'legumbres'), ing('huevos', 2, 'ud', 'huevos'),
      ing('gambas', 120, 'g', 'pescados'), ing('salsa gochujang', 1, 'cucharada', 'salsas'),
      ing('ajo', 2, 'diente', 'verduras'), ing('cebolleta', 1, 'ud', 'verduras'),
    ],
    pasos: [
      'Sofríe ajo y gochujang; añade caldo o agua.',
      'Incorpora el tofu en trozos y las gambas.',
      'Cuece 8 min y casca los huevos dentro.',
      'Remata con cebolleta.',
    ],
  },

  // ----- Sudeste asiático -----
  {
    nombre: 'Larb de pollo', categoria: 'tailandesa', sabor: 'acido', tiempoPreparacion: 20,
    precioPorPorcion: 2.2, porciones: 2, calorias: 420, proteinas: 38, carbohidratos: 26, grasas: 18,
    ingredientes: [
      ing('pollo picado', 350, 'g', 'carnes'), ing('lima', 1, 'ud', 'frutas'),
      ing('salsa de pescado', 2, 'cucharada', 'salsas'), ing('cebolla roja', 0.5, 'ud', 'verduras'),
      ing('cilantro', 1, 'puñado', 'verduras'), ing('arroz', 120, 'g', 'cereales'),
    ],
    pasos: [
      'Saltea el pollo picado hasta dorar.',
      'Fuera del fuego, mezcla con lima, salsa de pescado y cebolla.',
      'Añade cilantro y sirve con arroz.',
    ],
  },
  {
    nombre: 'Pollo a la albahaca tailandés (pad krapow)', categoria: 'tailandesa', sabor: 'salado', tiempoPreparacion: 20,
    precioPorPorcion: 2.3, porciones: 2, calorias: 540, proteinas: 39, carbohidratos: 52, grasas: 18,
    ingredientes: [
      ing('pollo picado', 350, 'g', 'carnes'), ing('arroz', 200, 'g', 'cereales'),
      ing('albahaca', 1, 'puñado', 'verduras'), ing('salsa de soja', 2, 'cucharada', 'salsas'),
      ing('salsa de ostras', 1, 'cucharada', 'salsas'), ing('ajo', 3, 'diente', 'verduras'),
    ],
    pasos: [
      'Cuece el arroz.',
      'Saltea ajo y pollo a fuego fuerte.',
      'Añade soja y salsa de ostras 2 min.',
      'Fuera del fuego mezcla la albahaca y sirve sobre arroz.',
    ],
  },
  {
    nombre: 'Pollo satay', categoria: 'indonesia', sabor: 'salado', tiempoPreparacion: 25,
    precioPorPorcion: 2.6, porciones: 2, calorias: 560, proteinas: 42, carbohidratos: 30, grasas: 30,
    ingredientes: [
      ing('pechuga de pollo', 400, 'g', 'carnes'), ing('crema de cacahuete', 3, 'cucharada', 'condimentos'),
      ing('leche de coco', 100, 'ml', 'lacteos'), ing('salsa de soja', 2, 'cucharada', 'salsas'),
      ing('lima', 0.5, 'ud', 'frutas'), ing('ajo', 2, 'diente', 'verduras'),
    ],
    pasos: [
      'Ensarta el pollo en dados y ásalo 10 min.',
      'Calienta crema de cacahuete, coco, soja y lima.',
      'Sirve las brochetas con la salsa satay.',
    ],
  },

  // ----- Mediterránea: griega y turca -----
  {
    nombre: 'Souvlaki de pollo', categoria: 'griega', sabor: 'salado', tiempoPreparacion: 25,
    precioPorPorcion: 2.5, porciones: 2, calorias: 520, proteinas: 44, carbohidratos: 30, grasas: 24,
    ingredientes: [
      ing('pechuga de pollo', 400, 'g', 'carnes'), ing('yogur griego', 100, 'g', 'lacteos'),
      ing('pan de pita', 2, 'ud', 'cereales'), ing('limón', 0.5, 'ud', 'frutas'),
      ing('orégano', 1, 'cucharada', 'condimentos'), ing('ajo', 2, 'diente', 'verduras'),
    ],
    pasos: [
      'Marina el pollo en dados con limón, orégano y ajo.',
      'Ensarta y asa 10-12 min.',
      'Calienta las pitas.',
      'Sirve con yogur como salsa.',
    ],
  },
  {
    nombre: 'Gyros de pollo', categoria: 'griega', sabor: 'salado', tiempoPreparacion: 30,
    precioPorPorcion: 2.7, porciones: 2, calorias: 620, proteinas: 43, carbohidratos: 48, grasas: 28,
    ingredientes: [
      ing('contramuslos de pollo', 400, 'g', 'carnes'), ing('pan de pita', 2, 'ud', 'cereales'),
      ing('yogur griego', 120, 'g', 'lacteos'), ing('pepino', 0.5, 'ud', 'verduras'),
      ing('tomate', 1, 'ud', 'verduras'), ing('pimentón', 1, 'cucharadita', 'condimentos'),
    ],
    pasos: [
      'Marina el pollo con pimentón y asa hasta dorar.',
      'Ralla el pepino y mézclalo con el yogur (tzatziki).',
      'Rellena las pitas con pollo, tomate y tzatziki.',
    ],
  },
  {
    nombre: 'Köfte turco', categoria: 'turca', sabor: 'salado', tiempoPreparacion: 25,
    precioPorPorcion: 2.4, porciones: 2, calorias: 540, proteinas: 36, carbohidratos: 28, grasas: 32,
    ingredientes: [
      ing('carne picada de ternera', 350, 'g', 'carnes'), ing('cebolla', 0.5, 'ud', 'verduras'),
      ing('comino', 1, 'cucharadita', 'condimentos'), ing('pan rallado', 30, 'g', 'cereales'),
      ing('perejil', 1, 'puñado', 'verduras'), ing('yogur griego', 100, 'g', 'lacteos'),
    ],
    pasos: [
      'Mezcla carne, cebolla rallada, comino, pan y perejil.',
      'Forma cilindros y dóralos en la sartén 8 min.',
      'Sirve con yogur.',
    ],
  },
  {
    nombre: 'Tavuk şiş (brochetas turcas de pollo)', categoria: 'turca', sabor: 'salado', tiempoPreparacion: 25,
    precioPorPorcion: 2.6, porciones: 2, calorias: 500, proteinas: 45, carbohidratos: 24, grasas: 24,
    ingredientes: [
      ing('pechuga de pollo', 400, 'g', 'carnes'), ing('yogur griego', 120, 'g', 'lacteos'),
      ing('pimiento', 1, 'ud', 'verduras'), ing('pimentón', 1, 'cucharadita', 'condimentos'),
      ing('ajo', 2, 'diente', 'verduras'), ing('limón', 0.5, 'ud', 'frutas'),
    ],
    pasos: [
      'Marina el pollo con yogur, pimentón, ajo y limón.',
      'Ensarta alternando con pimiento.',
      'Asa 12 min girando.',
    ],
  },
  {
    nombre: 'Menemen', categoria: 'turca', sabor: 'salado', tiempoPreparacion: 15,
    precioPorPorcion: 1.8, porciones: 2, calorias: 380, proteinas: 30, carbohidratos: 16, grasas: 24,
    ingredientes: [
      ing('huevos', 5, 'ud', 'huevos'), ing('tomate', 2, 'ud', 'verduras'),
      ing('pimiento verde', 1, 'ud', 'verduras'), ing('queso feta', 60, 'g', 'lacteos'),
      ing('aceite de oliva', 1, 'cucharada', 'condimentos'),
    ],
    pasos: [
      'Pocha el pimiento y el tomate 8 min.',
      'Añade los huevos y remueve suave hasta cuajar.',
      'Desmiga el feta por encima.',
    ],
  },

  // ----- Italiana / española / fusión -----
  {
    nombre: 'Pasta al tonno proteica', categoria: 'italiana', sabor: 'salado', tiempoPreparacion: 20,
    precioPorPorcion: 1.9, porciones: 2, calorias: 580, proteinas: 38, carbohidratos: 70, grasas: 14,
    ingredientes: [
      ing('pasta', 180, 'g', 'cereales'), ing('atún en lata al natural', 240, 'g', 'pescados'),
      ing('tomate triturado', 300, 'g', 'verduras'), ing('ajo', 2, 'diente', 'verduras'),
      ing('aceite de oliva', 1, 'cucharada', 'condimentos'),
    ],
    pasos: [
      'Cuece la pasta.',
      'Sofríe el ajo y añade el tomate; cuece 8 min.',
      'Incorpora el atún escurrido.',
      'Mezcla con la pasta y sirve.',
    ],
  },
  {
    nombre: 'Pollo piccata', categoria: 'italiana', sabor: 'acido', tiempoPreparacion: 25,
    precioPorPorcion: 2.8, porciones: 2, calorias: 480, proteinas: 44, carbohidratos: 18, grasas: 24,
    ingredientes: [
      ing('pechuga de pollo', 400, 'g', 'carnes'), ing('limón', 1, 'ud', 'frutas'),
      ing('harina', 30, 'g', 'cereales'), ing('alcaparras', 1, 'cucharada', 'condimentos'),
      ing('mantequilla', 20, 'g', 'lacteos'), ing('ajo', 1, 'diente', 'verduras'),
    ],
    pasos: [
      'Enharina los filetes de pollo y dóralos.',
      'Desglasa con limón, alcaparras y un poco de agua.',
      'Liga con mantequilla y sirve.',
    ],
  },
  {
    nombre: 'Tortilla proteica española', categoria: 'espanola', sabor: 'salado', tiempoPreparacion: 25,
    precioPorPorcion: 1.6, porciones: 2, calorias: 440, proteinas: 31, carbohidratos: 30, grasas: 22,
    ingredientes: [
      ing('huevos', 5, 'ud', 'huevos'), ing('patata', 250, 'g', 'verduras'),
      ing('cebolla', 0.5, 'ud', 'verduras'), ing('clara de huevo', 100, 'ml', 'huevos'),
      ing('aceite de oliva', 2, 'cucharada', 'condimentos'),
    ],
    pasos: [
      'Confita la patata y la cebolla en aceite a fuego suave.',
      'Bate los huevos con las claras y mezcla con la patata.',
      'Cuaja la tortilla por ambos lados.',
    ],
  },
  {
    nombre: 'Bowl de pollo con tzatziki', categoria: 'griega', sabor: 'salado', tiempoPreparacion: 25,
    precioPorPorcion: 2.7, porciones: 2, calorias: 540, proteinas: 45, carbohidratos: 48, grasas: 18,
    ingredientes: [
      ing('pechuga de pollo', 400, 'g', 'carnes'), ing('arroz', 180, 'g', 'cereales'),
      ing('yogur griego', 120, 'g', 'lacteos'), ing('pepino', 0.5, 'ud', 'verduras'),
      ing('tomate cherry', 100, 'g', 'verduras'), ing('limón', 0.5, 'ud', 'frutas'),
    ],
    pasos: [
      'Cuece el arroz.',
      'Saltea el pollo en dados con limón.',
      'Mezcla yogur con pepino rallado.',
      'Monta el bol con arroz, pollo, tomate y tzatziki.',
    ],
  },
]

async function run() {
  let backfilled = 0
  for (const [id, cal, prot, carb, gra] of BACKFILL) {
    const res = await sql`
      UPDATE recetas SET calorias = ${cal}, proteinas = ${prot}, carbohidratos = ${carb}, grasas = ${gra}
      WHERE id = ${id} AND calorias IS NULL RETURNING id`
    if (res.length > 0) backfilled++
  }
  console.log(`Backfill: ${backfilled} recetas actualizadas (${BACKFILL.length - backfilled} ya tenían macros).`)

  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase()
  const existentes = await sql`SELECT nombre FROM recetas`
  const set = new Set(existentes.map((r) => norm(r.nombre)))
  const cats = await sql`SELECT name, id FROM categories`
  const catId = Object.fromEntries(cats.map((c) => [c.name, c.id]))

  let inserted = 0, skipped = 0
  for (const r of NUEVAS) {
    if (set.has(norm(r.nombre))) { skipped++; continue }
    const cid = catId[r.sabor]
    if (!cid) { console.warn(`Sabor desconocido en "${r.nombre}": ${r.sabor}`); continue }
    await sql`
      INSERT INTO recetas (nombre, categoria, tiempo_preparacion, favorita, imagen, ingredientes, pasos, precio_por_porcion, porciones, category_id, calorias, proteinas, carbohidratos, grasas)
      VALUES (${r.nombre}, ${r.categoria}, ${r.tiempoPreparacion}, false, null,
        ${JSON.stringify(r.ingredientes)}, ${JSON.stringify(r.pasos)},
        ${r.precioPorPorcion}, ${r.porciones}, ${cid},
        ${r.calorias}, ${r.proteinas}, ${r.carbohidratos}, ${r.grasas})`
    inserted++
  }
  console.log(`Nuevas: ${inserted} insertadas, ${skipped} ya existían.`)
}

run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
