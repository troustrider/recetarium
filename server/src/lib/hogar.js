// Dueño del estado de la app (plan, despensa, extras, pendientes).
//
// Hasta la fase 3 de docs/PLAN-multiusuario-auth.md no hay sesión y todo el
// mundo escribe en el mismo hogar. Cuando llegue el login, este es el único
// sitio que cambia: el resto del backend ya pide el dueño aquí.
export const HOGAR_POR_DEFECTO = '00000000-0000-0000-0000-000000000001'

export function hogarDe() {
  return HOGAR_POR_DEFECTO
}
