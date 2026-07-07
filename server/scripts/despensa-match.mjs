// Port fiel de src/utils/despensa.ts (+ deps de ingredientes.ts y alias.ts)
// para poder calcular disponibilidad de recetas desde scripts de Node.
// Mantener sincronizado si cambia la lógica del front.

const ALIAS_TOKENS = {
  ketjap: 'kecap', langostino: 'gamba', gambon: 'gamba',
  culantro: 'cilantro', palta: 'aguacate', choclo: 'maiz',
}
const aplicarAlias = (t) => ALIAS_TOKENS[t] ?? t

const normalizar = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase()

const UNIDAD_CANON = {
  cda: 'cucharada', cdas: 'cucharada', cucharadas: 'cucharada',
  cdta: 'cucharadita', cdtas: 'cucharadita', cucharaditas: 'cucharadita',
  dientes: 'diente', hojas: 'hoja', lonchas: 'loncha', rodajas: 'rodaja',
  rebanadas: 'rebanada', unidad: 'ud', unidades: 'ud', uds: 'ud',
  gr: 'g', grs: 'g', gramos: 'g', mililitros: 'ml', punados: 'puñado',
  pizcas: 'pizca', gotas: 'gota', tiras: 'tira', latas: 'lata', paquetes: 'paquete',
}
const AL_GUSTO = new Set(['sal', 'pimienta', 'sal y pimienta', 'sal y pimienta al gusto'])
function canonUnidad(nombre, unidad) {
  if (AL_GUSTO.has(normalizar(nombre))) return 'al gusto'
  const k = normalizar(unidad)
  if (k === 'pizca' || k === 'al gusto') return 'al gusto'
  return UNIDAD_CANON[k] ?? k
}

const STOPWORDS = new Set(['de', 'del', 'la', 'el', 'al', 'con', 'en', 'y', 'a', 'para', 'sin', 'o'])
const DESCRIPTORES = new Set([
  'fresco', 'fresca', 'congelado', 'congelada', 'congelados', 'congeladas',
  'seco', 'seca', 'molido', 'molida', 'picado', 'picada', 'rallado', 'rallada',
  'cocido', 'cocida', 'cocidos', 'cocidas', 'natural', 'virgen', 'extra',
  'bote', 'lata', 'enlatado', 'ahumada', 'ahumado', 'tamizado', 'tamizada',
  'semi', 'desnatado', 'desnatada', 'entera', 'entero', 'integral', 'baja',
  'planos', 'finas', 'fina', 'variadas',
])
const CABEZAS_AMBIGUAS = new Set(['aceite', 'leche', 'salsa', 'vino', 'vinagre', 'caldo', 'harina', 'pasta', 'crema'])

function singular(t) {
  if (t.length > 3 && t.endsWith('es')) return t.slice(0, -2)
  if (t.length > 3 && t.endsWith('s')) return t.slice(0, -1)
  return t
}
function tokens(nombre) {
  return normalizar(nombre)
    .replace(/[()]/g, ' ')
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter((t) => t && !STOPWORDS.has(t))
    .map(singular)
    .map(aplicarAlias)
}
function nucleo(nombre) {
  const t = tokens(nombre)
  const sinDesc = t.filter((x) => !DESCRIPTORES.has(x))
  return new Set(sinDesc.length ? sinDesc : t)
}
const esSuperset = (a, b) => b.size > 0 && [...b].every((x) => a.has(x))

function despensaCubre(enDespensa, deReceta) {
  const p = nucleo(enDespensa)
  const r = nucleo(deReceta)
  if (p.size === 0 || r.size === 0) return normalizar(enDespensa) === normalizar(deReceta)
  if (esSuperset(p, r) && esSuperset(r, p)) return true
  if (esSuperset(p, r)) return true
  if (esSuperset(r, p)) return !(p.size === 1 && CABEZAS_AMBIGUAS.has([...p][0]))
  return false
}

// Nº de ingredientes de la receta que la despensa no cubre (ignora "al gusto").
export function faltan(receta, despensa) {
  return (receta.ingredientes || [])
    .filter((ing) => canonUnidad(ing.nombre, ing.unidad) !== 'al gusto')
    .filter((ing) => !despensa.some((d) => despensaCubre(d.nombre, ing.nombre)))
    .length
}
