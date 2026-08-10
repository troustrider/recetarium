// Caducidad orientativa al dar de alta un ingrediente: la verdura y la fruta se
// venden a granel y sin fecha impresa. Es un punto de partida editable, no un
// dato del envase. Los días son vida útil en casa desde la compra, con el
// producto bien guardado (nevera lo perecedero, fresco y seco el resto).

import { nucleoOrdenado } from './despensa'
import { normalizar } from './ingredientes'

// Envase cerrado con su propia fecha, o cosas que duran años: estimarlo solo
// produciría avisos falsos.
const FAMILIAS_SIN_ESTIMAR = new Set([
  'conservas', 'especias', 'condimentos', 'salsas', 'bebidas', 'frutos secos', 'hogar',
])

// Suelo para el ingrediente que no esté en la tabla de abajo. Las familias que
// faltan solo estiman si el ingrediente concreto sí aparece en ella.
const DIAS_POR_FAMILIA: Record<string, number> = {
  verduras: 7,
  frutas: 7,
  carnes: 3,
  pescados: 2,
  lacteos: 10,
  huevos: 21,
}

// Por ingrediente, cuando se aparta de su familia: dentro de "verduras" van dos
// órdenes de magnitud entre los canónigos (3 días) y el ajo (90).
const DIAS_POR_INGREDIENTE: Record<string, number> = {
  // Hoja, brotes y hierbas: lo primero que se va
  canonigos: 3, brotes: 3, germinados: 3, rucula: 4, espinaca: 4,
  lechuga: 5, escarola: 5, acelga: 5, kale: 6, 'pak choi': 6, endivia: 10,
  albahaca: 5, cilantro: 5, eneldo: 5, perejil: 6, menta: 6, cebollino: 7,
  // Verduras de fruto y vaina
  aguacate: 4, guisante: 5, esparrago: 5, maiz: 5, tomate: 7, 'judia verde': 7,
  pepino: 8, calabacin: 10, berenjena: 10, pimiento: 12,
  // Crucíferas, tallos y setas
  seta: 5, champinon: 6, brocoli: 8, 'coles de bruselas': 8, alcachofa: 7,
  coliflor: 10, apio: 12, puerro: 12, col: 21, lombarda: 21, calabaza: 30,
  // Raíces y bulbos: lo que aguanta de verdad
  rabano: 10, zanahoria: 21, remolacha: 21, nabo: 21, jengibre: 21,
  boniato: 30, cebolla: 40, chalota: 40, patata: 45, ajo: 90,
  // Frutas
  fresa: 3, frambuesa: 3, mora: 3, higo: 3,
  platano: 5, melocoton: 5, nectarina: 5, cereza: 5, mango: 5, papaya: 5, pina: 5,
  ciruela: 6, arandano: 7, melon: 7, pera: 8, uva: 8, sandia: 8,
  kiwi: 12, mandarina: 14, manzana: 21, naranja: 21, pomelo: 21,
  limon: 21, lima: 21, granada: 21, datil: 90,
  // Carnes: el ave y la picada se van antes que la pieza entera
  pollo: 2, pavo: 2, higado: 2, carne: 2,
  cerdo: 3, ternera: 3, buey: 3, cordero: 3, conejo: 3,
  salchicha: 4, jamon: 5, bacon: 10, chorizo: 30, salami: 30, salchichon: 30,
  // Pescados y marisco
  mejillon: 1, almeja: 1,
  pescado: 2, salmon: 2, bacalao: 2, merluza: 2, atun: 2, dorada: 2, lubina: 2,
  gamba: 2, calamar: 2, surimi: 14,
  // Lácteos
  burrata: 5, leche: 7, nata: 7, mozzarella: 7, requeson: 7, ricotta: 7,
  'crema agria': 10, queso: 14, feta: 14,
  yogur: 21, skyr: 21, quark: 21, mantequilla: 45,
  // Fuera de las familias perecederas, pero se estropean igual
  pan: 4, 'pan de molde': 8, hummus: 5, tofu: 7,
}

// Las claves se escriben en lenguaje natural y se reducen con el mismo
// tokenizador que los nombres de entrada, para que plurales y acentos casen.
const TABLA = new Map(
  Object.entries(DIAS_POR_INGREDIENTE).map(([nombre, dias]) => [nucleoOrdenado(nombre).join(' '), dias])
)

const DIAS_CONGELADO = 180

// Nombre completo primero, luego la cabeza ("pechuga de pollo" no está, pero
// "pollo" sí) y por último los tokens sueltos, que solo se miran si la familia
// ya es perecedera: así "harina de maíz" no hereda los 5 días del maíz.
export function diasEstimados(nombre: string, familia: string): number | null {
  const fam = normalizar(familia)
  if (FAMILIAS_SIN_ESTIMAR.has(fam)) return null

  const nucleo = nucleoOrdenado(nombre)
  if (nucleo.length === 0) return null

  const porFamilia = DIAS_POR_FAMILIA[fam] ?? null
  const base =
    TABLA.get(nucleo.join(' ')) ??
    TABLA.get(nucleo[0]) ??
    (porFamilia == null
      ? null
      : nucleo.map((t) => TABLA.get(t)).find((d) => d != null) ?? porFamilia)

  if (base == null) return null
  return /congelad/.test(normalizar(nombre)) ? DIAS_CONGELADO : base
}

export function sumarDias(dias: number, desde = new Date()): string {
  const d = new Date(desde)
  d.setHours(12, 0, 0, 0) // mediodía: el horario de verano no mueve el día
  d.setDate(d.getDate() + dias)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// YYYY-MM-DD, o null si el ingrediente no es de los que se estiman.
export function caducidadEstimada(nombre: string, familia: string, hoy = new Date()): string | null {
  const dias = diasEstimados(nombre, familia)
  return dias == null ? null : sumarDias(dias, hoy)
}
