import sql from '../lib/db.js'
import { fichaNutricional, estimarMacros } from '../lib/nutricion.js'

const CAMPOS = sql.unsafe(`
  r.id, r.nombre, r.categoria, c.name AS sabor,
  r.tiempo_preparacion AS "tiempoPreparacion",
  r.imagen, r.ingredientes, r.pasos, r.consejos,
  r.precio_por_porcion::float AS "precioPorPorcion", r.porciones,
  r.calorias, r.proteinas::float AS proteinas,
  r.carbohidratos::float AS carbohidratos, r.grasas::float AS grasas, r.tipo,
  r.hierro::float AS hierro, r.sin_gluten AS "sinGluten", r.micros, r.guarnicion,
  r.hogar_id IS NOT NULL AS privada
`)

const CAMPOS_LISTA = sql.unsafe(`
  r.id, r.nombre, r.categoria, c.name AS sabor,
  r.tiempo_preparacion AS "tiempoPreparacion",
  r.imagen, r.ingredientes,
  r.precio_por_porcion::float AS "precioPorPorcion", r.porciones,
  r.calorias, r.proteinas::float AS proteinas,
  r.carbohidratos::float AS carbohidratos, r.grasas::float AS grasas, r.tipo,
  r.hierro::float AS hierro, r.sin_gluten AS "sinGluten", r.micros,
  r.guarnicion - 'pasos' AS guarnicion,
  r.hogar_id IS NOT NULL AS privada
`)

export async function getAll(hogarId, { categoria, sabor } = {}) {
  return sql`
    SELECT ${CAMPOS_LISTA},
           EXISTS (SELECT 1 FROM favoritas f WHERE f.receta_id = r.id AND f.hogar_id = ${hogarId}) AS favorita
    FROM recetas r INNER JOIN categories c ON r.category_id = c.id
    WHERE r.borrada_en IS NULL
      AND (r.hogar_id IS NULL OR r.hogar_id = ${hogarId})
      AND (${categoria ?? null}::text IS NULL OR r.categoria = ${categoria ?? null})
      AND (${sabor ?? null}::text IS NULL OR c.name = ${sabor ?? null})
    ORDER BY r.nombre
  `
}

export async function getById(hogarId, id) {
  const [row] = await sql`
    SELECT ${CAMPOS},
           EXISTS (SELECT 1 FROM favoritas f WHERE f.receta_id = r.id AND f.hogar_id = ${hogarId}) AS favorita
    FROM recetas r INNER JOIN categories c ON r.category_id = c.id
    WHERE r.borrada_en IS NULL
      AND r.id = ${id}
      AND (r.hogar_id IS NULL OR r.hogar_id = ${hogarId})
  `
  return row ?? null
}

export async function duenoDe(id) {
  const [row] = await sql`SELECT hogar_id AS "hogarId" FROM recetas WHERE id = ${id}`
  return row ?? null
}

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

export async function create(hogarId, hogarDueno, data) {
  const { nombre, sabor, categoria, tiempoPreparacion, imagen, ingredientes, pasos, consejos, precioPorPorcion, porciones, calorias, proteinas, carbohidratos, grasas, tipo } = data
  const categoryId = await getCategoryId(sabor)
  const ficha = fichaNutricional({ ingredientes, porciones: porciones ?? 1 })
  const guarnicion = guarnicionConFicha(data.guarnicion, porciones ?? 1)
  const [row] = await sql`
    INSERT INTO recetas (nombre, categoria, tiempo_preparacion, imagen, ingredientes, pasos, consejos, precio_por_porcion, porciones, category_id, calorias, proteinas, carbohidratos, grasas, tipo, hierro, sin_gluten, micros, guarnicion, hogar_id)
    VALUES (
      ${nombre}, ${categoria ?? null}, ${tiempoPreparacion},
      ${imagen ?? null}, ${JSON.stringify(ingredientes)}, ${JSON.stringify(pasos)}, ${JSON.stringify(consejos ?? [])},
      ${precioPorPorcion ?? 1}, ${porciones ?? 1}, ${categoryId},
      ${calorias ?? null}, ${proteinas ?? null}, ${carbohidratos ?? null}, ${grasas ?? null}, ${tipo ?? 'principal'},
      ${ficha.hierro}, ${ficha.sinGluten}, ${JSON.stringify(ficha.micros)},
      ${guarnicion ? JSON.stringify(guarnicion) : null},
      ${hogarDueno}
    )
    RETURNING id
  `
  return getById(hogarId, row.id)
}

export async function update(hogarId, id, data) {
  const { nombre, sabor, categoria, tiempoPreparacion, imagen, ingredientes, pasos, consejos, precioPorPorcion, porciones, calorias, proteinas, carbohidratos, grasas, tipo } = data
  const categoryId = await getCategoryId(sabor)
  const raciones = porciones ?? (await getById(hogarId, id))?.porciones ?? 1
  const ficha = fichaNutricional({ ingredientes, porciones: raciones })
  const guarnicion = guarnicionConFicha(data.guarnicion, raciones)
  const result = await sql`
    UPDATE recetas SET
      nombre = ${nombre},
      categoria = ${categoria ?? null},
      tiempo_preparacion = ${tiempoPreparacion},
      imagen = ${imagen ?? null},
      ingredientes = ${JSON.stringify(ingredientes)},
      pasos = ${JSON.stringify(pasos)},
      consejos = ${JSON.stringify(consejos ?? [])},
      category_id = ${categoryId},
      precio_por_porcion = COALESCE(${precioPorPorcion ?? null}, precio_por_porcion),
      porciones = COALESCE(${porciones ?? null}, porciones),
      calorias = COALESCE(${calorias ?? null}, calorias),
      proteinas = COALESCE(${proteinas ?? null}, proteinas),
      carbohidratos = COALESCE(${carbohidratos ?? null}, carbohidratos),
      grasas = COALESCE(${grasas ?? null}, grasas),
      tipo = COALESCE(${tipo ?? null}, tipo),
      hierro = ${ficha.hierro},
      sin_gluten = ${ficha.sinGluten},
      micros = ${JSON.stringify(ficha.micros)},
      guarnicion = ${guarnicion ? JSON.stringify(guarnicion) : null}
    WHERE id = ${id}
    RETURNING id
  `
  if (result.length === 0) return null
  return getById(hogarId, id)
}

export async function toggleFavorita(hogarId, id) {
  const receta = await getById(hogarId, id)
  if (!receta) return null
  if (receta.favorita) {
    await sql`DELETE FROM favoritas WHERE hogar_id = ${hogarId} AND receta_id = ${id}`
  } else {
    await sql`
      INSERT INTO favoritas (hogar_id, receta_id) VALUES (${hogarId}, ${id})
      ON CONFLICT DO NOTHING
    `
  }
  return getById(hogarId, id)
}

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
