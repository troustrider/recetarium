import app from '../src/app.js'
import sql from '../src/lib/db.js'

const HOGAR_COMPARTIDO = '00000000-0000-0000-0000-000000000001'

export async function arrancarServidor() {
  const server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  const { port } = server.address()
  return {
    base: `http://127.0.0.1:${port}/api/v1`,
    cerrar: () => new Promise((resolve) => server.close(resolve)),
  }
}

const creados = { usuarios: [], hogares: [] }

export async function limpiarCreados() {
  if (creados.usuarios.length) {
    await sql`DELETE FROM miembros WHERE usuario_id = ANY(${creados.usuarios}::uuid[])`
    await sql`DELETE FROM neon_auth.session WHERE "userId" = ANY(${creados.usuarios}::uuid[])`
    await sql`DELETE FROM neon_auth."user" WHERE id = ANY(${creados.usuarios}::uuid[])`
    creados.usuarios.length = 0
  }
  if (creados.hogares.length) {
    await sql`DELETE FROM hogares WHERE id = ANY(${creados.hogares}::uuid[])`
    creados.hogares.length = 0
  }
}

export async function crearSesion({ rol = 'admin', hogarId = HOGAR_COMPARTIDO } = {}) {
  const email = `helper-${crypto.randomUUID()}@test.dev`
  const [u] = await sql`
    INSERT INTO neon_auth."user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), 'Helper', ${email}, true, now(), now())
    RETURNING id
  `
  const token = `helper-${crypto.randomUUID()}`
  await sql`
    INSERT INTO neon_auth.session (id, token, "userId", "expiresAt", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), ${token}, ${u.id}, now() + interval '1 day', now(), now())
  `
  await sql`INSERT INTO miembros (usuario_id, hogar_id, rol) VALUES (${u.id}, ${hogarId}, ${rol})`
  creados.usuarios.push(u.id)

  return {
    token,
    usuarioId: u.id,
    email,
    hogarId,
    borrar: async () => {
      await sql`DELETE FROM miembros WHERE usuario_id = ${u.id}`
      await sql`DELETE FROM neon_auth.session WHERE "userId" = ${u.id}`
      await sql`DELETE FROM neon_auth."user" WHERE id = ${u.id}`
    },
  }
}

export async function crearHogar(nombre = 'Hogar de pruebas') {
  const [h] = await sql`INSERT INTO hogares (nombre) VALUES (${nombre}) RETURNING id`
  creados.hogares.push(h.id)
  return { id: h.id, borrar: () => sql`DELETE FROM hogares WHERE id = ${h.id}` }
}

export function api(base, token) {
  const con = (options = {}) => ({
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  return {
    get: (ruta) => fetch(`${base}${ruta}`, con()),
    post: (ruta, body) => fetch(`${base}${ruta}`, con({ method: 'POST', body: JSON.stringify(body) })),
    put: (ruta, body) => fetch(`${base}${ruta}`, con({ method: 'PUT', body: JSON.stringify(body) })),
    patch: (ruta) => fetch(`${base}${ruta}`, con({ method: 'PATCH' })),
    del: (ruta) => fetch(`${base}${ruta}`, con({ method: 'DELETE' })),
    crudo: (ruta, options) => fetch(`${base}${ruta}`, options),
  }
}

export function recetaValida(extra = {}) {
  return {
    nombre: 'Receta de prueba',
    categoria: 'pruebas',
    sabor: 'salado',
    tiempoPreparacion: 20,
    ingredientes: [{ nombre: 'arroz', cantidad: 200, unidad: 'g', familia: 'cereales' }],
    pasos: ['Cocer el arroz'],
    precioPorPorcion: 1.5,
    porciones: 2,
    ...extra,
  }
}
