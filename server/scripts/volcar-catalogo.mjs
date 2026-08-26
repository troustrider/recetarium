/**
 * Vuelca el catálogo vivo al JSON que come `scripts/simular-semana.ts`.
 *
 * La simulación de la auto-semana necesita las recetas con la misma forma que
 * las sirve `GET /recetas`, y esas viven en la base, no en el repo. Este script
 * las saca de una vez para poder medir la sinergia contra el catálogo real.
 *
 *   node --env-file=server/.env server/scripts/volcar-catalogo.mjs catalogo.json
 *   npx vite-node scripts/simular-semana.ts catalogo.json
 *
 * El fichero que sale no se commitea: es una foto de la base, y la base manda.
 */
import { writeFileSync } from 'node:fs'
import { neon } from '@neondatabase/serverless'

const destino = process.argv[2] ?? 'catalogo.json'

if (!process.env.DATABASE_URL) {
  console.error('Falta DATABASE_URL. Pásalo con --env-file=server/.env o en el entorno.')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)

// Los mismos campos que CAMPOS_LISTA en recetasService: lo que ve el
// planificador. Sin `pasos` ni `imagen`, que no entran en el reparto.
const recetas = await sql`
  SELECT r.id, r.nombre, r.categoria, c.name AS sabor,
         r.tiempo_preparacion AS "tiempoPreparacion",
         r.ingredientes,
         r.precio_por_porcion::float AS "precioPorPorcion", r.porciones,
         r.calorias, r.proteinas::float AS proteinas,
         r.carbohidratos::float AS carbohidratos, r.grasas::float AS grasas,
         r.tipo, r.hierro::float AS hierro, r.sin_gluten AS "sinGluten",
         r.micros, r.apto, r.guarnicion - 'pasos' AS guarnicion,
         false AS favorita
  FROM recetas r
  LEFT JOIN categories c ON c.id = r.category_id
  WHERE r.borrada_en IS NULL
  ORDER BY r.id
`

writeFileSync(destino, JSON.stringify(recetas))

const porTipo = recetas.reduce((t, r) => ({ ...t, [r.tipo ?? 'principal']: (t[r.tipo ?? 'principal'] ?? 0) + 1 }), {})
const lineas = recetas.reduce(
  (t, r) => t + r.ingredientes.length + (r.guarnicion?.ingredientes?.length ?? 0),
  0
)
console.log(`${recetas.length} recetas → ${destino}`)
console.log(Object.entries(porTipo).map(([k, v]) => `  ${k}: ${v}`).join('\n'))
console.log(`  líneas de ingrediente: ${lineas}`)
