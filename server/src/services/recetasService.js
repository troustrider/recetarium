import sql from '../lib/db.js'
import { fichaNutricional, estimarMacros } from '../lib/nutricion.js'

export async function getAll({ categoria, sabor } = {}) {
  if (categoria && sabor) {
    return sql`
      SELECT r.id, r.nombre, r.categoria, c.name AS sabor,
             r.tiempo_preparacion AS "tiempoPreparacion",
             r.favorita, r.imagen, r.ingredientes, r.pasos, r.consejos,
             r.precio_por_porcion::float AS "precioPorPorcion", r.porciones,
             r.calorias, r.proteinas::float AS proteinas,
             r.carbohidratos::float AS carbohidratos, r.grasas::float AS grasas, r.tipo,
             r.hierro::float AS hierro, r.sin_gluten AS "sinGluten", r.micros, r.guarnicion
      FROM recetas r INNER JOIN categories c ON r.category_id = c.id
      WHERE r.borrada_en IS NULL AND r.categoria = ${categoria} AND c.name = ${sabor}
      ORDER BY r.nombre
    `
  }
  if (categoria) {
    return sql`
      SELECT r.id, r.nombre, r.categoria, c.name AS sabor,
             r.tiempo_preparacion AS "tiempoPreparacion",
             r.favorita, r.imagen, r.ingredientes, r.pasos, r.consejos,
             r.precio_por_porcion::float AS "precioPorPorcion", r.porciones,
             r.calorias, r.proteinas::float AS proteinas,
             r.carbohidratos::float AS carbohidratos, r.grasas::float AS grasas, r.tipo,
             r.hierro::float AS hierro, r.sin_gluten AS "sinGluten", r.micros, r.guarnicion
      FROM recetas r INNER JOIN categories c ON r.category_id = c.id
      WHERE r.borrada_en IS NULL AND r.categoria = ${categoria}
      ORDER BY r.nombre
    `
  }
  if (sabor) {
    return sql`
      SELECT r.id, r.nombre, r.categoria, c.name AS sabor,
             r.tiempo_preparacion AS "tiempoPreparacion",
             r.favorita, r.imagen, r.ingredientes, r.pasos, r.consejos,
             r.precio_por_porcion::float AS "precioPorPorcion", r.porciones,
             r.calorias, r.proteinas::float AS proteinas,
             r.carbohidratos::float AS carbohidratos, r.grasas::float AS grasas, r.tipo,
             r.hierro::float AS hierro, r.sin_gluten AS "sinGluten", r.micros, r.guarnicion
      FROM recetas r INNER JOIN categories c ON r.category_id = c.id
      WHERE r.borrada_en IS NULL AND c.name = ${sabor}
      ORDER BY r.nombre
    `
  }
  return sql`
    SELECT r.id, r.nombre, r.categoria, c.name AS sabor,
           r.tiempo_preparacion AS "tiempoPreparacion",
           r.favorita, r.imagen, r.ingredientes, r.pasos, r.consejos,
           r.precio_por_porcion::float AS "precioPorPorcion", r.porciones,
           r.calorias, r.proteinas::float AS proteinas,
           r.carbohidratos::float AS carbohidratos, r.grasas::float AS grasas, r.tipo,
           r.hierro::float AS hierro, r.sin_gluten AS "sinGluten", r.micros, r.guarnicion
    FROM recetas r INNER JOIN categories c ON r.category_id = c.id
    WHERE r.borrada_en IS NULL
    ORDER BY r.nombre
  `
}

export async function getById(id) {
  const [row] = await sql`
    SELECT r.id, r.nombre, r.categoria, c.name AS sabor,
           r.tiempo_preparacion AS "tiempoPreparacion",
           r.favorita, r.imagen, r.ingredientes, r.pasos, r.consejos,
           r.precio_por_porcion::float AS "precioPorPorcion", r.porciones,
           r.calorias, r.proteinas::float AS proteinas,
           r.carbohidratos::float AS carbohidratos, r.grasas::float AS grasas, r.tipo,
           r.hierro::float AS hierro, r.sin_gluten AS "sinGluten", r.micros, r.guarnicion
    FROM recetas r INNER JOIN categories c ON r.category_id = c.id
    WHERE r.borrada_en IS NULL AND r.id = ${id}
  `
  return row ?? null
}

// Ficha propia, con los mismos gramajes por ración que el plato: así la del
// plato sigue siendo la del plato solo y la app puede sumar aparte.
function guarnicionConFicha(guarnicion, porciones) {
  if (!guarnicion) return null
  const entrada = { ingredientes: guarnicion.ingredientes, porciones }
  const macros = estimarMacros(entrada)
  const ficha = fichaNutricional(entrada)
  const red1 = (n) => Math.round(n * 10) / 10
  return {
    nombre: guarnicion.nombre,
    ingredientes: guarnicion.ingredientes,
    pasos: guarnicion.pasos ?? [],
    calorias: Math.round(macros.calorias),
    proteinas: red1(macros.proteinas),
    carbohidratos: red1(macros.carbohidratos),
    grasas: red1(macros.grasas),
    hierro: ficha.hierro,
    sinGluten: ficha.sinGluten,
    micros: ficha.micros,
  }
}

async function getCategoryId(sabor) {
  const [cat] = await sql`SELECT id FROM categories WHERE name = ${sabor}`
  if (!cat) throw new Error(`Sabor desconocido: ${sabor}`)
  return cat.id
}

export async function create(data) {
  const { nombre, sabor, categoria, tiempoPreparacion, favorita, imagen, ingredientes, pasos, consejos, precioPorPorcion, porciones, calorias, proteinas, carbohidratos, grasas, tipo } = data
  const categoryId = await getCategoryId(sabor)
  // Siempre de los ingredientes, nunca del payload: no tiene sentido dejar que
  // alguien los declare a mano.
  const ficha = fichaNutricional({ ingredientes, porciones: porciones ?? 1 })
  const guarnicion = guarnicionConFicha(data.guarnicion, porciones ?? 1)
  const [row] = await sql`
    INSERT INTO recetas (nombre, categoria, tiempo_preparacion, favorita, imagen, ingredientes, pasos, consejos, precio_por_porcion, porciones, category_id, calorias, proteinas, carbohidratos, grasas, tipo, hierro, sin_gluten, micros, guarnicion)
    VALUES (
      ${nombre}, ${categoria ?? null}, ${tiempoPreparacion}, ${favorita ?? false},
      ${imagen ?? null}, ${JSON.stringify(ingredientes)}, ${JSON.stringify(pasos)}, ${JSON.stringify(consejos ?? [])},
      ${precioPorPorcion ?? 1}, ${porciones ?? 1}, ${categoryId},
      ${calorias ?? null}, ${proteinas ?? null}, ${carbohidratos ?? null}, ${grasas ?? null}, ${tipo ?? 'principal'},
      ${ficha.hierro}, ${ficha.sinGluten}, ${JSON.stringify(ficha.micros)},
      ${guarnicion ? JSON.stringify(guarnicion) : null}
    )
    RETURNING id
  `
  return getById(row.id)
}

export async function update(id, data) {
  const { nombre, sabor, categoria, tiempoPreparacion, favorita, imagen, ingredientes, pasos, consejos, precioPorPorcion, porciones, calorias, proteinas, carbohidratos, grasas, tipo } = data
  const categoryId = await getCategoryId(sabor)
  // porciones se conserva con COALESCE si el payload no la trae: la ficha divide
  // por la que quede en la fila, no por 1.
  const raciones = porciones ?? (await getById(id))?.porciones ?? 1
  const ficha = fichaNutricional({ ingredientes, porciones: raciones })
  const guarnicion = guarnicionConFicha(data.guarnicion, raciones)
  const result = await sql`
    UPDATE recetas SET
      nombre = ${nombre},
      categoria = ${categoria ?? null},
      tiempo_preparacion = ${tiempoPreparacion},
      favorita = COALESCE(${favorita ?? null}, favorita),
      imagen = ${imagen ?? null},
      ingredientes = ${JSON.stringify(ingredientes)},
      pasos = ${JSON.stringify(pasos)},
      consejos = ${JSON.stringify(consejos ?? [])},
      category_id = ${categoryId},
      precio_por_porcion = COALESCE(${precioPorPorcion ?? null}, precio_por_porcion),
      porciones = COALESCE(${porciones ?? null}, porciones),
      calorias = ${calorias ?? null},
      proteinas = ${proteinas ?? null},
      carbohidratos = ${carbohidratos ?? null},
      grasas = ${grasas ?? null},
      tipo = COALESCE(${tipo ?? null}, tipo),
      hierro = ${ficha.hierro},
      sin_gluten = ${ficha.sinGluten},
      micros = ${JSON.stringify(ficha.micros)},
      guarnicion = ${guarnicion ? JSON.stringify(guarnicion) : null}
    WHERE id = ${id}
    RETURNING id
  `
  if (result.length === 0) return null
  return getById(id)
}

export async function toggleFavorita(id) {
  const result = await sql`
    UPDATE recetas SET favorita = NOT favorita
    WHERE id = ${id}
    RETURNING id
  `
  if (result.length === 0) return null
  return getById(id)
}

// Borrado lógico: la fila se queda para que restaurar devuelva la receta con su
// mismo id, que es por donde la referencian el plan y las pendientes.
export async function remove(id) {
  const result = await sql`
    UPDATE recetas SET borrada_en = now()
    WHERE id = ${id} AND borrada_en IS NULL
    RETURNING id
  `
  return result.length > 0
}

export async function restore(id) {
  const result = await sql`
    UPDATE recetas SET borrada_en = NULL
    WHERE id = ${id} AND borrada_en IS NOT NULL
    RETURNING id
  `
  return result.length > 0
}
