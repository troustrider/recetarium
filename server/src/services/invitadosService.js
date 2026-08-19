import sql from '../lib/db.js'

export async function listar() {
  return sql`
    SELECT i.email, i.hogar_id AS "hogarId", h.nombre AS hogar, i.rol,
           i.invitado_en AS "invitadoEn", i.usado_en AS "usadoEn",
           EXISTS (
             SELECT 1 FROM usuarios u
             JOIN miembros m ON m.usuario_id = u.id
             WHERE u.email = i.email
           ) AS "haEntrado"
    FROM invitados i
    LEFT JOIN hogares h ON h.id = i.hogar_id
    ORDER BY i.invitado_en DESC
  `
}

export async function invitar({ email, hogarId, rol }) {
  const [fila] = await sql`
    INSERT INTO invitados (email, hogar_id, rol)
    VALUES (${email.toLowerCase()}, ${hogarId}, ${rol})
    ON CONFLICT (email) DO UPDATE SET hogar_id = EXCLUDED.hogar_id, rol = EXCLUDED.rol
    RETURNING email, hogar_id AS "hogarId", rol, usado_en AS "usadoEn"
  `
  return fila
}

export async function retirar(email) {
  const filas = await sql`
    DELETE FROM invitados WHERE email = ${email.toLowerCase()} AND usado_en IS NULL RETURNING email
  `
  return filas.length > 0
}

export async function hogares() {
  return sql`
    SELECT h.id, h.nombre, count(m.usuario_id)::int AS miembros
    FROM hogares h LEFT JOIN miembros m ON m.hogar_id = h.id
    GROUP BY h.id, h.nombre
    ORDER BY h.creado_en
  `
}
