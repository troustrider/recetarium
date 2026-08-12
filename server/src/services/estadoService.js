import sql from '../lib/db.js'

const CAMPOS = ['plan', 'despensa', 'extras', 'pendientes']

function columna(campo) {
  if (!CAMPOS.includes(campo)) throw new Error(`Campo de estado no permitido: ${campo}`)
  return sql.unsafe(campo)
}

export async function getCampo(hogarId, campo) {
  const col = columna(campo)
  const [row] = await sql`SELECT ${col} FROM app_estado WHERE hogar_id = ${hogarId}`
  return row?.[campo] ?? []
}

export async function setCampo(hogarId, campo, valor) {
  const col = columna(campo)
  const [row] = await sql`
    INSERT INTO app_estado (hogar_id, ${col}, updated_at)
    VALUES (${hogarId}, ${JSON.stringify(valor)}, now())
    ON CONFLICT (hogar_id) DO UPDATE SET ${col} = EXCLUDED.${col}, updated_at = now()
    RETURNING ${col}, updated_at AS "updatedAt"
  `
  return row
}

export const getPlan = (hogarId) => getCampo(hogarId, 'plan')
export const setPlan = (hogarId, plan) => setCampo(hogarId, 'plan', plan)

export const getDespensa = (hogarId) => getCampo(hogarId, 'despensa')
export const setDespensa = (hogarId, despensa) => setCampo(hogarId, 'despensa', despensa)

export const getPendientes = (hogarId) => getCampo(hogarId, 'pendientes')
export const setPendientes = (hogarId, pendientes) => setCampo(hogarId, 'pendientes', pendientes)

export const getExtras = (hogarId) => getCampo(hogarId, 'extras')
export const setExtras = (hogarId, extras) => setCampo(hogarId, 'extras', extras)
