// Passphrase compartida para escrituras. Si APP_KEY no está configurada
// (p. ej. en local), el middleware deja pasar para no romper el desarrollo.
export function requireKey(req, res, next) {
  const expected = process.env.APP_KEY
  if (!expected) return next()
  if (req.get('x-app-key') === expected) return next()
  return res.status(401).json({ error: 'Clave incorrecta o ausente' })
}
