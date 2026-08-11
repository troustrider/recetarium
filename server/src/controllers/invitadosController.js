import * as invitadosService from '../services/invitadosService.js'

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ROLES = ['admin', 'usuario']

export async function getInvitados(req, res) {
  const [invitados, hogares] = await Promise.all([invitadosService.listar(), invitadosService.hogares()])
  res.json({ invitados, hogares })
}

export async function postInvitado(req, res) {
  const { email, hogarId, rol = 'usuario' } = req.body ?? {}
  if (typeof email !== 'string' || !RE_EMAIL.test(email.trim())) {
    return res.status(400).json({ error: 'Correo no válido' })
  }
  if (!ROLES.includes(rol)) return res.status(400).json({ error: `rol debe ser uno de: ${ROLES.join(', ')}` })
  // null es un destino válido y significa "hogar propio", así que se distingue
  // de un uuid mal escrito en vez de tratar todo lo que no sea uuid como null.
  if (hogarId !== null && hogarId !== undefined && !RE_UUID.test(hogarId)) {
    return res.status(400).json({ error: 'hogarId debe ser un uuid o null' })
  }
  if (hogarId) {
    const existe = (await invitadosService.hogares()).some((h) => h.id === hogarId)
    if (!existe) return res.status(400).json({ error: 'Ese hogar no existe' })
  }
  const fila = await invitadosService.invitar({ email: email.trim(), hogarId: hogarId ?? null, rol })
  res.status(201).json(fila)
}

export async function deleteInvitado(req, res) {
  const ok = await invitadosService.retirar(req.params.email)
  if (!ok) return res.status(404).json({ error: 'No hay invitación pendiente para ese correo' })
  res.status(204).end()
}
