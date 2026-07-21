import sql from '../lib/db.js'

export async function getPlan() {
  const [row] = await sql`SELECT plan FROM app_estado WHERE id = 1`
  return row?.plan ?? []
}

export async function setPlan(plan) {
  const [row] = await sql`
    INSERT INTO app_estado (id, plan, updated_at)
    VALUES (1, ${JSON.stringify(plan)}, now())
    ON CONFLICT (id) DO UPDATE SET plan = EXCLUDED.plan, updated_at = now()
    RETURNING plan, updated_at AS "updatedAt"
  `
  return row
}

export async function getDespensa() {
  const [row] = await sql`SELECT despensa FROM app_estado WHERE id = 1`
  return row?.despensa ?? []
}

export async function setDespensa(despensa) {
  const [row] = await sql`
    INSERT INTO app_estado (id, despensa, updated_at)
    VALUES (1, ${JSON.stringify(despensa)}, now())
    ON CONFLICT (id) DO UPDATE SET despensa = EXCLUDED.despensa, updated_at = now()
    RETURNING despensa, updated_at AS "updatedAt"
  `
  return row
}

export async function getPendientes() {
  const [row] = await sql`SELECT pendientes FROM app_estado WHERE id = 1`
  return row?.pendientes ?? []
}

export async function setPendientes(pendientes) {
  const [row] = await sql`
    INSERT INTO app_estado (id, pendientes, updated_at)
    VALUES (1, ${JSON.stringify(pendientes)}, now())
    ON CONFLICT (id) DO UPDATE SET pendientes = EXCLUDED.pendientes, updated_at = now()
    RETURNING pendientes, updated_at AS "updatedAt"
  `
  return row
}

export async function getExtras() {
  const [row] = await sql`SELECT extras FROM app_estado WHERE id = 1`
  return row?.extras ?? []
}

export async function setExtras(extras) {
  const [row] = await sql`
    INSERT INTO app_estado (id, extras, updated_at)
    VALUES (1, ${JSON.stringify(extras)}, now())
    ON CONFLICT (id) DO UPDATE SET extras = EXCLUDED.extras, updated_at = now()
    RETURNING extras, updated_at AS "updatedAt"
  `
  return row
}
