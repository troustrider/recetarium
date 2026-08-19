import * as auth from '../services/authService.js'
import { miembroDe } from '../lib/auth.js'
import { destinoPermitido } from '../lib/origenes.js'
import {
  cliente,
  canjearCodigo,
  nuevoEstado,
  nuevoVerificador,
  perfilDe,
  urlDeGoogle,
  urlDeRetorno,
} from '../lib/oauthGoogle.js'

const ipDe = (req) => (req.get('x-forwarded-for') ?? '').split(',')[0].trim() || req.ip || null

function conAviso(destino, aviso) {
  const url = new URL(destino)
  url.hash = aviso
  return url.toString()
}

export async function inicio(req, res) {
  if (!cliente()) return res.status(503).json({ error: 'Falta configurar el acceso con Google' })

  const destino = destinoPermitido(req.query.destino ?? '')
  if (!destino) return res.status(400).json({ error: 'Destino no permitido' })

  const estado = nuevoEstado()
  const verificador = nuevoVerificador()
  await auth.guardarEstado({ estado, verificador, destino })
  res.redirect(urlDeGoogle({ estado, verificador, retorno: urlDeRetorno(req) }))
}

export async function callback(req, res) {
  const guardado = req.query.state ? await auth.consumirEstado(req.query.state) : null
  if (!guardado) return res.status(400).json({ error: 'Estado de acceso no válido o caducado' })

  const { destino, verificador } = guardado
  if (req.query.error || !req.query.code) return res.redirect(conAviso(destino, 'acceso=cancelado'))

  let usuario
  try {
    const idToken = await canjearCodigo({
      codigo: req.query.code,
      verificador,
      retorno: urlDeRetorno(req),
    })
    const perfil = await perfilDe(idToken)
    usuario = await auth.guardarUsuario(perfil)
  } catch (e) {
    console.error(e)
    return res.redirect(conAviso(destino, 'acceso=fallo'))
  }

  if (usuario.banned) return res.redirect(conAviso(destino, 'acceso=suspendido'))
  const miembro = await miembroDe(usuario)
  if (!miembro) return res.redirect(conAviso(destino, 'acceso=sin-invitacion'))

  const token = await auth.crearSesion(usuario.id, {
    ip: ipDe(req),
    agente: req.get('user-agent'),
  })
  res.redirect(conAviso(destino, `sesion=${token}`))
}
