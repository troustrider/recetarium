import sql from '../lib/db.js'

const CAMPOS = sql.unsafe(`
  g.id, g.nombre, g.ingredientes, g.pasos, g.cocinas, g.aporta,
  g.calorias, g.proteinas::float AS proteinas,
  g.carbohidratos::float AS carbohidratos, g.grasas::float AS grasas,
  g.hierro::float AS hierro, g.sin_gluten AS "sinGluten", g.micros, g.apto,
  g.hogar_id IS NOT NULL AS privada
`)

export async function getAll(hogarId) {
  return sql`
    SELECT ${CAMPOS} FROM guarniciones g
    WHERE g.borrada_en IS NULL AND (g.hogar_id IS NULL OR g.hogar_id = ${hogarId})
    ORDER BY g.nombre`
}
