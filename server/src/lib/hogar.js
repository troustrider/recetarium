export function hogarDe(req) {
  const hogarId = req.usuario?.hogarId
  if (!hogarId) throw new Error('hogarDe() sin sesión: falta requireUser en esta ruta')
  return hogarId
}
