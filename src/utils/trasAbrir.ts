import { nucleoOrdenado } from './despensa'
import { normalizar } from './ingredientes'
import { sumarDias } from './caducidadEstimada'

const DIAS_TRAS_ABRIR: Record<string, number> = {
  // Lácteos: lo que más engaña, porque el envase cerrado dura meses
  nata: 3, 'nata para cocinar': 3, 'nata montada': 5, 'crema agria': 7, 'creme fraiche': 7,
  leche: 4, 'leche de coco': 3, 'leche condensada': 7, 'leche evaporada': 3,
  'bebida de avena': 5, 'bebida de soja': 5, 'bebida de almendra': 5,
  yogur: 4, skyr: 5, quark: 5, requeson: 4, ricotta: 4, mascarpone: 5,
  'queso crema': 10, 'queso rallado': 7, mozzarella: 2, burrata: 1, feta: 7,
  queso: 14, parmesano: 30, mantequilla: 30,

  // Fiambres y ahumados: el corte es la puerta de entrada, no la fecha
  jamon: 4, 'jamon cocido': 4, pavo: 4, fiambre: 4, mortadela: 4, bacon: 7,
  chorizo: 21, salchichon: 21, salami: 21, salchicha: 3,
  'salmon ahumado': 3, pate: 3, surimi: 3, 'gambas cocidas': 2,

  // Vegetal fresco envasado: la bolsa abierta acelera todo
  hummus: 3, guacamole: 2, tofu: 3, tempeh: 5, seitan: 4,
  ensalada: 2, brotes: 2, canonigos: 2, espinacas: 3, rucula: 2,

  'tomate triturado': 4, passata: 4, 'tomate frito': 5, 'salsa de tomate': 5,
  atun: 2, sardinas: 2, caballa: 2, berberechos: 2,
  aceitunas: 14, pepinillos: 30, alcaparras: 30,

  // Salsas y untables: duran, pero no para siempre
  pesto: 5, mayonesa: 30, ketchup: 60, mostaza: 90, sriracha: 90, tahini: 60,
  'salsa de soja': 180, miso: 180, kimchi: 60, 'crema de cacahuete': 90,
  'mantequilla de cacahuete': 90, 'salsa barbacoa': 60, harissa: 30, 'curry en pasta': 21,

  // Masas, pan y refrigerados de fecha corta
  'masa de hojaldre': 3, 'masa quebrada': 3, 'masa de pizza': 3, 'pasta fresca': 3,
  'pan de molde': 7, tortillas: 7, wraps: 7, gnocchi: 3,
  'levadura fresca': 7, 'clara de huevo': 3, 'huevo liquido': 3,

  // Líquidos de brik: se abren y se olvidan al fondo de la puerta
  caldo: 4, zumo: 4, 'vino blanco': 5, 'vino tinto': 5,
}

const TABLA = new Map(
  Object.entries(DIAS_TRAS_ABRIR).map(([nombre, dias]) => [nucleoOrdenado(nombre).join(' '), dias])
)

const DIAS_POR_FAMILIA: Record<string, number> = {
  conservas: 3,
}

/** Días que aguanta el paquete abierto, o `null` si abrirlo no le hace nada. */
export function diasTrasAbrir(nombre: string, familia: string): number | null {
  // Lo congelado se saca a cachos: abrir la bolsa no arranca ningún reloj.
  if (/congelad/.test(normalizar(nombre))) return null

  const nucleo = nucleoOrdenado(nombre)
  if (nucleo.length === 0) return null

  return (
    TABLA.get(nucleo.join(' ')) ??
    TABLA.get(nucleo[0]) ??
    DIAS_POR_FAMILIA[normalizar(familia)] ??
    null
  )
}

/** La fecha hasta la que aguanta un paquete abierto el día `abierto`. */
export function caducidadTrasAbrir(nombre: string, familia: string, abierto: string): string | null {
  const dias = diasTrasAbrir(nombre, familia)
  return dias == null ? null : sumarDias(dias, new Date(`${abierto}T12:00:00`))
}

export interface ItemAbrible {
  nombre: string
  familia: string
  caducidad?: string
}

export function caducidadAlAbrir(item: ItemAbrible, abierto: string): string | undefined {
  const tras = caducidadTrasAbrir(item.nombre, item.familia, abierto)
  if (tras == null) return item.caducidad
  return item.caducidad != null && item.caducidad < tras ? item.caducidad : tras
}
