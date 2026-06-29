import sql from '../lib/db.js'

export async function getAll({ categoria, sabor } = {}) {
  if (categoria && sabor) {
    return sql`
      SELECT r.id, r.nombre, r.categoria, c.name AS sabor,
             r.tiempo_preparacion AS "tiempoPreparacion",
             r.favorita, r.imagen, r.ingredientes, r.pasos,
             r.precio_por_porcion, r.porciones,
             r.calorias, r.proteinas::float AS proteinas,
             r.carbohidratos::float AS carbohidratos, r.grasas::float AS grasas
      FROM recetas r INNER JOIN categories c ON r.category_id = c.id
      WHERE r.categoria = ${categoria} AND c.name = ${sabor}
      ORDER BY r.nombre
    `
  }
  if (categoria) {
    return sql`
      SELECT r.id, r.nombre, r.categoria, c.name AS sabor,
             r.tiempo_preparacion AS "tiempoPreparacion",
             r.favorita, r.imagen, r.ingredientes, r.pasos,
             r.precio_por_porcion, r.porciones,
             r.calorias, r.proteinas::float AS proteinas,
             r.carbohidratos::float AS carbohidratos, r.grasas::float AS grasas
      FROM recetas r INNER JOIN categories c ON r.category_id = c.id
      WHERE r.categoria = ${categoria}
      ORDER BY r.nombre
    `
  }
  if (sabor) {
    return sql`
      SELECT r.id, r.nombre, r.categoria, c.name AS sabor,
             r.tiempo_preparacion AS "tiempoPreparacion",
             r.favorita, r.imagen, r.ingredientes, r.pasos,
             r.precio_por_porcion, r.porciones,
             r.calorias, r.proteinas::float AS proteinas,
             r.carbohidratos::float AS carbohidratos, r.grasas::float AS grasas
      FROM recetas r INNER JOIN categories c ON r.category_id = c.id
      WHERE c.name = ${sabor}
      ORDER BY r.nombre
    `
  }
  return sql`
    SELECT r.id, r.nombre, r.categoria, c.name AS sabor,
           r.tiempo_preparacion AS "tiempoPreparacion",
           r.favorita, r.imagen, r.ingredientes, r.pasos,
           r.precio_por_porcion, r.porciones
    FROM recetas r INNER JOIN categories c ON r.category_id = c.id
    ORDER BY r.nombre
  `
}

export async function getById(id) {
  const [row] = await sql`
    SELECT r.id, r.nombre, r.categoria, c.name AS sabor,
           r.tiempo_preparacion AS "tiempoPreparacion",
           r.favorita, r.imagen, r.ingredientes, r.pasos,
           r.precio_por_porcion, r.porciones,
           r.calorias, r.proteinas::float AS proteinas,
           r.carbohidratos::float AS carbohidratos, r.grasas::float AS grasas
    FROM recetas r INNER JOIN categories c ON r.category_id = c.id
    WHERE r.id = ${id}
  `
  return row ?? null
}

async function getCategoryId(sabor) {
  const [cat] = await sql`SELECT id FROM categories WHERE name = ${sabor}`
  if (!cat) throw new Error(`Sabor desconocido: ${sabor}`)
  return cat.id
}

export async function create(data) {
  const { nombre, sabor, categoria, tiempoPreparacion, favorita, imagen, ingredientes, pasos, precioPorPorcion, porciones, calorias, proteinas, carbohidratos, grasas } = data
  const categoryId = await getCategoryId(sabor)
  const [row] = await sql`
    INSERT INTO recetas (nombre, categoria, tiempo_preparacion, favorita, imagen, ingredientes, pasos, precio_por_porcion, porciones, category_id, calorias, proteinas, carbohidratos, grasas)
    VALUES (
      ${nombre}, ${categoria ?? null}, ${tiempoPreparacion}, ${favorita ?? false},
      ${imagen ?? null}, ${JSON.stringify(ingredientes)}, ${JSON.stringify(pasos)},
      ${precioPorPorcion ?? 1}, ${porciones ?? 1}, ${categoryId},
      ${calorias ?? null}, ${proteinas ?? null}, ${carbohidratos ?? null}, ${grasas ?? null}
    )
    RETURNING id
  `
  return getById(row.id)
}

export async function update(id, data) {
  const { nombre, sabor, categoria, tiempoPreparacion, favorita, imagen, ingredientes, pasos, precioPorPorcion, porciones, calorias, proteinas, carbohidratos, grasas } = data
  const categoryId = await getCategoryId(sabor)
  const result = await sql`
    UPDATE recetas SET
      nombre = ${nombre},
      categoria = ${categoria ?? null},
      tiempo_preparacion = ${tiempoPreparacion},
      favorita = ${favorita ?? false},
      imagen = ${imagen ?? null},
      ingredientes = ${JSON.stringify(ingredientes)},
      pasos = ${JSON.stringify(pasos)},
      category_id = ${categoryId},
      precio_por_porcion = COALESCE(${precioPorPorcion ?? null}, precio_por_porcion),
      porciones = COALESCE(${porciones ?? null}, porciones),
      calorias = ${calorias ?? null},
      proteinas = ${proteinas ?? null},
      carbohidratos = ${carbohidratos ?? null},
      grasas = ${grasas ?? null}
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

export async function remove(id) {
  const result = await sql`DELETE FROM recetas WHERE id = ${id} RETURNING id`
  return result.length > 0
}
