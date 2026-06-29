// Normalización y humanización de ingredientes para la lista de la compra.
// Evita que el mismo ingrediente aparezca duplicado por diferencias de
// mayúsculas, acentos, plurales o abreviaturas de unidad, y formatea las
// cantidades de forma legible (½ limón, 2 huevos, sal al gusto).

export function normalizar(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase()
}

// Abreviaturas y plurales de unidad → forma canónica.
const UNIDAD_CANON: Record<string, string> = {
  cda: 'cucharada', cdas: 'cucharada', cucharadas: 'cucharada',
  cdta: 'cucharadita', cdtas: 'cucharadita', cucharaditas: 'cucharadita',
  dientes: 'diente', hojas: 'hoja', lonchas: 'loncha', rodajas: 'rodaja',
  rebanadas: 'rebanada', unidad: 'ud', unidades: 'ud', uds: 'ud',
  gr: 'g', grs: 'g', gramos: 'g', mililitros: 'ml', punados: 'puñado',
  pizcas: 'pizca', gotas: 'gota', tiras: 'tira', latas: 'lata', paquetes: 'paquete',
}

// Condimentos básicos que se compran "al gusto" (no tiene sentido una cantidad).
const AL_GUSTO = new Set(['sal', 'pimienta', 'sal y pimienta', 'sal y pimienta al gusto'])

export function canonUnidad(nombre: string, unidad: string): string {
  if (AL_GUSTO.has(normalizar(nombre))) return 'al gusto'
  const k = normalizar(unidad)
  if (k === 'pizca' || k === 'al gusto') return 'al gusto'
  return UNIDAD_CANON[k] ?? k
}

// Clave estable para agrupar y para el estado de "comprado".
export function claveIngrediente(nombre: string, unidad: string): string {
  return `${normalizar(nombre)}__${canonUnidad(nombre, unidad)}`
}

const FRACCIONES: Record<string, string> = { '0.25': '¼', '0.5': '½', '0.75': '¾', '0.33': '⅓', '0.67': '⅔' }

function formatNumero(n: number): string {
  const entero = Math.floor(n)
  const dec = +(n - entero).toFixed(2)
  if (dec === 0) return String(entero)
  const frac = FRACCIONES[String(dec)]
  if (frac) return entero > 0 ? `${entero}${frac}` : frac
  return String(+n.toFixed(2))
}

export function formatCantidad(cantidad: number, unidad: string): string {
  if (unidad === 'al gusto') return 'al gusto'
  if (unidad === 'ud') return formatNumero(cantidad)
  return `${formatNumero(cantidad)} ${unidad}`
}
