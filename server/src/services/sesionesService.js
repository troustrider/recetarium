import sql from '../lib/db.js'

export async function limpiarCaducadas() {
  const filas = await sql`DELETE FROM neon_auth.session WHERE "expiresAt" <= now() RETURNING id`
  return filas.length
}

export async function listarSesiones(limite = 100) {
  return sql`
    SELECT
      s.id,
      u.email,
      s."ipAddress"  AS ip,
      s."userAgent"  AS agente,
      s."createdAt"  AS "creadaEn",
      s."expiresAt"  AS "caducaEn",
      s."expiresAt" > now() AS activa
    FROM neon_auth.session s
    JOIN neon_auth."user" u ON u.id = s."userId"
    ORDER BY s."createdAt" DESC
    LIMIT ${limite}
  `
}

export async function resumenPorUsuario() {
  return sql`
    SELECT
      u.email,
      count(*)::int                                              AS sesiones,
      count(*) FILTER (WHERE s."expiresAt" > now())::int          AS activas,
      count(DISTINCT s."ipAddress")::int                          AS ips,
      count(DISTINCT s."userAgent")::int                          AS dispositivos,
      max(s."createdAt")                                          AS "ultimoAcceso"
    FROM neon_auth.session s
    JOIN neon_auth."user" u ON u.id = s."userId"
    GROUP BY u.email
    ORDER BY max(s."createdAt") DESC
  `
}

export async function ipsNuevas(dias = 7) {
  return sql`
    WITH primera_vez AS (
      SELECT u.email, s."ipAddress" AS ip, min(s."createdAt") AS "vistaPrimeroEn", count(*)::int AS veces
      FROM neon_auth.session s
      JOIN neon_auth."user" u ON u.id = s."userId"
      WHERE s."ipAddress" IS NOT NULL
      GROUP BY u.email, s."ipAddress"
    )
    SELECT * FROM primera_vez
    WHERE "vistaPrimeroEn" > now() - make_interval(days => ${dias})
    ORDER BY "vistaPrimeroEn" DESC
  `
}
