import { config } from 'dotenv'

const args = process.argv.slice(2)
const usarTest = args.includes('--test')
config({ path: usarTest ? 'server/.env.test' : 'server/.env' })

const { listarSesiones, resumenPorUsuario, ipsNuevas, limpiarCaducadas } = await import(
  '../src/services/sesionesService.js'
)

function opcion(nombre, porDefecto) {
  const i = args.indexOf(`--${nombre}`)
  if (i === -1) return porDefecto
  const n = Number.parseInt(args[i + 1], 10)
  return Number.isFinite(n) && n > 0 ? n : porDefecto
}

function dispositivo(agente) {
  if (!agente) return 'desconocido'
  const so = /iPhone/i.test(agente) ? 'iPhone'
    : /iPad/i.test(agente) ? 'iPad'
    : /Android/i.test(agente) ? 'Android'
    : /Macintosh/i.test(agente) ? 'Mac'
    : /Windows/i.test(agente) ? 'Windows'
    : /Linux/i.test(agente) ? 'Linux'
    : 'otro'
  const nav = /Edg(iOS)?\//.test(agente) ? 'Edge'
    : /CriOS\/|Chrome\//.test(agente) ? 'Chrome'
    : /FxiOS\/|Firefox\//.test(agente) ? 'Firefox'
    : /Safari\//.test(agente) ? 'Safari'
    : '?'
  return `${so} / ${nav}`
}

const fecha = (v) => (v ? new Date(v).toISOString().slice(0, 16).replace('T', ' ') : '—')

const dias = opcion('dias', 7)
const limite = opcion('limite', 50)

console.log(`\nBase de datos: ${usarTest ? 'recetarium-test' : 'PRODUCCIÓN'}\n`)

if (args.includes('--limpiar')) {
  const borradas = await limpiarCaducadas()
  console.log(`Sesiones caducadas borradas: ${borradas}\n`)
}

const resumen = await resumenPorUsuario()
if (!resumen.length) {
  console.log('Todavía no hay ninguna sesión registrada.\n')
  process.exit(0)
}

console.log('Por usuario')
console.table(
  resumen.map((r) => ({
    usuario: r.email,
    sesiones: r.sesiones,
    activas: r.activas,
    IPs: r.ips,
    dispositivos: r.dispositivos,
    'último acceso': fecha(r.ultimoAcceso),
  }))
)

const nuevas = await ipsNuevas(dias)
console.log(`\nIPs vistas por primera vez en los últimos ${dias} días`)
if (!nuevas.length) {
  console.log('  ninguna\n')
} else {
  console.table(
    nuevas.map((n) => ({ usuario: n.email, ip: n.ip, desde: fecha(n.vistaPrimeroEn), sesiones: n.veces }))
  )
  console.log('  Si alguna IP no la reconoces, revisa el plan: la migración a Clerk pasa a ser prioritaria.\n')
}

const sesiones = await listarSesiones(limite)
console.log(`\nÚltimas ${sesiones.length} sesiones`)
console.table(
  sesiones.map((s) => ({
    usuario: s.email,
    ip: s.ip ?? '—',
    dispositivo: dispositivo(s.agente),
    creada: fecha(s.creadaEn),
    activa: s.activa ? 'sí' : 'no',
  }))
)
