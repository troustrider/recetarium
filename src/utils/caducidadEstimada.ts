import { nucleoOrdenado } from './despensa'
import { normalizar } from './ingredientes'

const DIAS_POR_FAMILIA: Record<string, number> = {
  verduras: 7,
  frutas: 7,
  carnes: 3,
  pescados: 2,
  lacteos: 10,
  huevos: 21,
}

const DIAS_POR_FAMILIA_SECA: Record<string, number> = {
  cereales: 365,
  legumbres: 540,
  conservas: 730,
  especias: 730,
  condimentos: 365,
  salsas: 365,
  bebidas: 365,
  'frutos secos': 180,
}

const DIAS_SECOS: Record<string, number> = {
  // "pasta fresca" y "pan rallado" no están: el núcleo del nombre les quita el
  // descriptor y quedan en "pasta" y "pan", así que taparían al seco y al fresco.
  pan: 4, 'pan de molde': 8, 'pan de pita': 14, tortillas: 30,
  masa: 3, 'masa de hojaldre': 3, 'masa quebrada': 3, gnocchi: 30,
  harina: 240, levadura: 365,
  arroz: 730, pasta: 730, cuscus: 730, bulgur: 730, quinoa: 730, avena: 365, polenta: 365,
  aceite: 540, vinagre: 1095, azucar: 1800, miel: 1800, sal: 1800,
  'leche de coco': 365, 'leche condensada': 365, 'leche evaporada': 365,
  caldo: 365, zumo: 180, vino: 730, cerveza: 270,
  cacao: 540, chocolate: 365, cafe: 365, mermelada: 540,
}

const DIAS_POR_INGREDIENTE: Record<string, number> = {
  canonigos: 3, brotes: 3, germinados: 3, rucula: 4, espinaca: 4,
  lechuga: 5, escarola: 5, acelga: 5, kale: 6, 'pak choi': 6, endivia: 10,
  albahaca: 5, cilantro: 5, eneldo: 5, perejil: 6, menta: 6, cebollino: 7,
  aguacate: 4, guisante: 5, esparrago: 5, maiz: 5, tomate: 7, 'judia verde': 7,
  pepino: 8, calabacin: 10, berenjena: 10, pimiento: 12,
  seta: 5, champinon: 6, brocoli: 8, 'coles de bruselas': 8, alcachofa: 7,
  coliflor: 10, apio: 12, puerro: 12, col: 21, lombarda: 21, calabaza: 30,
  rabano: 10, zanahoria: 21, remolacha: 21, nabo: 21, jengibre: 21,
  boniato: 30, cebolla: 40, chalota: 40, patata: 45, ajo: 90,
  fresa: 3, frambuesa: 3, mora: 3, higo: 3,
  platano: 5, melocoton: 5, nectarina: 5, cereza: 5, mango: 5, papaya: 5, pina: 5,
  ciruela: 6, arandano: 7, melon: 7, pera: 8, uva: 8, sandia: 8,
  kiwi: 12, mandarina: 14, manzana: 21, naranja: 21, pomelo: 21,
  limon: 21, lima: 21, granada: 21, datil: 90,
  pollo: 2, pavo: 2, higado: 2, carne: 2,
  cerdo: 3, ternera: 3, buey: 3, cordero: 3, conejo: 3,
  salchicha: 4, jamon: 5, bacon: 10, chorizo: 30, salami: 30, salchichon: 30,
  mejillon: 1, almeja: 1,
  pescado: 2, salmon: 2, bacalao: 2, merluza: 2, atun: 2, dorada: 2, lubina: 2,
  gamba: 2, calamar: 2, surimi: 14,
  burrata: 5, leche: 7, nata: 7, mozzarella: 7, requeson: 7, ricotta: 7,
  'crema agria': 10, queso: 14, feta: 14,
  yogur: 21, skyr: 21, quark: 21, mantequilla: 45,
  pan: 4, 'pan de molde': 8, hummus: 5, tofu: 7,
}

const tablaDe = (dias: Record<string, number>) =>
  new Map(Object.entries(dias).map(([nombre, d]) => [nucleoOrdenado(nombre).join(' '), d]))

const TABLA = tablaDe(DIAS_POR_INGREDIENTE)
const TABLA_SECA = tablaDe(DIAS_SECOS)

const DIAS_CONGELADO = 180

/** Lo que no se come: ni se estima ni cuenta para nada. */
const FAMILIA_SIN_COMIDA = 'hogar'

export const UMBRAL_NO_PERECEDERO_DIAS = 60

function diasSecos(nucleo: string[], fam: string): number | null {
  // En la despensa seca manda la familia, y el ingrediente solo cuando lo
  // contradice: el pan es `cereales` y dura cuatro días, no un año.
  return (
    TABLA_SECA.get(nucleo.join(' ')) ??
    TABLA_SECA.get(nucleo[0]) ??
    DIAS_POR_FAMILIA_SECA[fam] ??
    null
  )
}

export function diasEstimados(nombre: string, familia: string): number | null {
  const fam = normalizar(familia)
  if (fam === FAMILIA_SIN_COMIDA) return null

  const nucleo = nucleoOrdenado(nombre)
  if (nucleo.length === 0) return null

  const porFamilia = DIAS_POR_FAMILIA[fam] ?? null
  const base =
    fam in DIAS_POR_FAMILIA_SECA
      ? diasSecos(nucleo, fam)
      : TABLA.get(nucleo.join(' ')) ??
        TABLA.get(nucleo[0]) ??
        (porFamilia == null
          ? null
          : nucleo.map((t) => TABLA.get(t)).find((d) => d != null) ?? porFamilia)

  if (base == null) return null
  return /congelad/.test(normalizar(nombre)) ? DIAS_CONGELADO : base
}

/** Fondo de armario: dura lo bastante como para que no corra prisa gastarlo. */
export function esNoPerecedero(nombre: string, familia: string): boolean {
  const dias = diasEstimados(nombre, familia)
  return dias != null && dias >= UMBRAL_NO_PERECEDERO_DIAS
}

export function sumarDias(dias: number, desde = new Date()): string {
  const d = new Date(desde)
  d.setHours(12, 0, 0, 0) // mediodía: el horario de verano no mueve el día
  d.setDate(d.getDate() + dias)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function caducidadEstimada(nombre: string, familia: string, hoy = new Date()): string | null {
  const dias = diasEstimados(nombre, familia)
  return dias == null ? null : sumarDias(dias, hoy)
}
