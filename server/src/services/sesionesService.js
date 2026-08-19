import sql from '../lib/db.js'

export async function limpiarCaducadas() {
  const filas = await sql`DELETE FROM sesiones WHERE expira_en <= now() RETURNING token_hash`
  return filas.length
}

export async function listarSesiones(limite = 100) {
  return sql`
    SELECT
      s.token_hash   AS id,
      u.email,
      s.ip,
      s.agente,
      s.creada_en    AS "creadaEn",
      s.expira_en    AS "caducaEn",
      s.expira_en > now() AS activa
    FROM sesiones s
    JOIN usuarios u ON u.id = s.usuario_id
    ORDER BY s.creada_en DESC
    LIMIT ${limite}
  `
}

export async function resumenPorUsuario() {
  return sql`
    SELECT
      u.email,
      count(*)::int                                        AS sesiones,
      count(*) FILTER (WHERE s.expira_en > now())::int      AS activas,
      count(DISTINCT s.ip)::int                             AS ips,
      count(DISTINCT s.agente)::int                         AS dispositivos,
      max(s.creada_en)                                      AS "ultimoAcceso"
    FROM sesiones s
    JOIN usuarios u ON u.id = s.usuario_id
    GROUP BY u.email
    ORDER BY max(s.creada_en) DESC
  `
}

export async function ipsNuevas(dias = 7) {
  return sql`
    WITH primera_vez AS (
      SELECT u.email, s.ip, min(s.creada_en) AS "vistaPrimeroEn", count(*)::int AS veces
      FROM sesiones s
      JOIN usuarios u ON u.id = s.usuario_id
      WHERE s.ip IS NOT NULL
      GROUP BY u.email, s.ip
    )
    SELECT * FROM primera_vez
    WHERE "vistaPrimeroEn" > now() - make_interval(days => ${dias})
    ORDER BY "vistaPrimeroEn" DESC
  `
}
