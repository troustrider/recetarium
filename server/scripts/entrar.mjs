import { config } from 'dotenv'

const args = process.argv.slice(2)
const usarTest = args.includes('--test')
config({ path: usarTest ? 'server/.env.test' : 'server/.env' })

const { default: sql } = await import('../src/lib/db.js')
const { crearSesion } = await import('../src/services/authService.js')

const email = args.find((a) => a.includes('@'))?.trim().toLowerCase()
const iApp = args.indexOf('--app')
const app = (iApp !== -1 ? args[iApp + 1] : 'https://recetarium-one.vercel.app').replace(/\/$/, '')

if (!email) {
  console.error('Falta el correo.\n  node server/scripts/entrar.mjs <correo> [--app <url>] [--test]')
  process.exitCode = 1
} else {
  const [usuario] = await sql`SELECT id, suspendido FROM usuarios WHERE email = ${email}`
  if (!usuario) {
    console.error(`No existe ningún usuario con el correo ${email}.`)
    process.exitCode = 1
  } else if (usuario.suspendido) {
    console.error(`La cuenta ${email} está suspendida.`)
    process.exitCode = 1
  } else {
    const [miembro] = await sql`SELECT rol FROM miembros WHERE usuario_id = ${usuario.id}`
    if (!miembro) {
      console.error(`${email} no pertenece a ningún hogar todavía.`)
      process.exitCode = 1
    } else {
      const token = await crearSesion(usuario.id, { ip: null, agente: 'script entrar.mjs' })
      console.log(`\n${usarTest ? '[recetarium-test]' : '[PRODUCCIÓN]'} ${email} (${miembro.rol})`)
      console.log('  caduca en 30 días. Abre este enlace una sola vez:\n')
      console.log(`  ${app}/#sesion=${token}\n`)
    }
  }
}
