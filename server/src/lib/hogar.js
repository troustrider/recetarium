// Dueño del estado de la app (plan, despensa, extras, pendientes).
//
// Sale de la sesión, nunca de la petición. Si el cliente pudiera influir en qué
// hogar se lee o se escribe, bastaría con cambiar un número para ver la despensa
// de otro: es el fallo número uno en apps multiusuario caseras.
//
// Lanza en vez de caer en un hogar por defecto. Un fallo ruidoso en una ruta mal
// configurada es preferible a servir en silencio los datos del hogar equivocado.
export function hogarDe(req) {
  const hogarId = req.usuario?.hogarId
  if (!hogarId) throw new Error('hogarDe() sin sesión: falta requireUser en esta ruta')
  return hogarId
}
