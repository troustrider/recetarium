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
