import sql from '../lib/db.js'

const CAMPOS = ['plan', 'despensa', 'extras', 'pendientes', 'preferencias']

// Los cuatro primeros son listas; las preferencias son un objeto. Sin esto, un
// hogar que nunca las ha tocado recibiría [] y el front tendría que adivinar.
const VACIO = { preferencias: {} }

function columna(campo) {
  if (!CAMPOS.includes(campo)) throw new Error(`Campo de estado no permitido: ${campo}`)
  return sql.unsafe(campo)
}

export async function getCampo(hogarId, campo) {
  const col = columna(campo)
  const [row] = await sql`SELECT ${col} FROM app_estado WHERE hogar_id = ${hogarId}`
  return row?.[campo] ?? VACIO[campo] ?? []
}

export async function setCampo(hogarId, campo, valor) {
  const col = columna(campo)
  const [row] = await sql`
    INSERT INTO app_estado (hogar_id, ${col}, updated_at)
    VALUES (${hogarId}, ${JSON.stringify(valor)}, now())
    ON CONFLICT (hogar_id) DO UPDATE SET ${col} = EXCLUDED.${col}, updated_at = now()
    RETURNING ${col}
  `
  return row?.[campo] ?? VACIO[campo] ?? []
}
