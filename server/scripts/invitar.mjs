import { config } from 'dotenv'

const args = process.argv.slice(2)
const usarTest = args.includes('--test')
config({ path: usarTest ? 'server/.env.test' : 'server/.env' })

const { default: sql } = await import('../src/lib/db.js')

const HOGAR_COMPARTIDO = '00000000-0000-0000-0000-000000000001'

const email = args.find((a) => a.includes('@'))?.trim().toLowerCase()
if (!email) {
  console.error('Falta el correo.\n  node server/scripts/invitar.mjs <correo> [--compartido|--propio|--hogar <uuid>] [--admin] [--quitar] [--test]')
  process.exitCode = 1
} else if (args.includes('--quitar')) {
  const filas = await sql`DELETE FROM invitados WHERE email = ${email} AND usado_en IS NULL RETURNING email`
  console.log(filas.length ? `Invitación retirada: ${email}` : `Sin invitación pendiente para ${email} (¿ya la usó?)`)
} else {
  const iHogar = args.indexOf('--hogar')
  const hogarId = args.includes('--compartido')
    ? HOGAR_COMPARTIDO
    : iHogar !== -1
      ? args[iHogar + 1]
      : null

  if (!args.includes('--propio') && !args.includes('--compartido') && iHogar === -1) {
    console.error('Elige destino: --compartido, --propio o --hogar <uuid>.')
    process.exitCode = 1
  } else {
    const rol = args.includes('--admin') ? 'admin' : 'usuario'

    if (hogarId) {
      const [hogar] = await sql`SELECT nombre FROM hogares WHERE id = ${hogarId}`
      if (!hogar) {
        console.error(`No existe el hogar ${hogarId}.`)
        process.exitCode = 1
      } else {
        await guardar(hogarId, rol, `hogar «${hogar.nombre}»`)
      }
    } else {
      await guardar(null, rol, 'hogar propio, se creará al entrar')
    }
  }
}

async function guardar(hogarId, rol, destino) {
  const [fila] = await sql`
    INSERT INTO invitados (email, hogar_id, rol)
    VALUES (${email}, ${hogarId}, ${rol})
    ON CONFLICT (email) DO UPDATE SET hogar_id = EXCLUDED.hogar_id, rol = EXCLUDED.rol
    RETURNING email, usado_en AS "usadoEn"
  `
  console.log(`\n${usarTest ? '[recetarium-test]' : '[PRODUCCIÓN]'} ${fila.email}`)
  console.log(`  destino: ${destino}`)
  console.log(`  rol:     ${rol}`)
  if (fila.usadoEn) {
    console.log('  aviso:   ya había entrado antes. Cambiar la invitación no le mueve de hogar;')
    console.log('           para eso hay que tocar la fila de miembros.')
  }
  console.log()
}
