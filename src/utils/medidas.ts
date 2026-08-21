import { convertir } from './cantidades'
import { normalizar } from './ingredientes'

export interface Medida {
  cantidad: number
  unidad: string
}

/**
 * Qué unidad manda cuando el mismo ingrediente llega en varias. Gana la que se
 * puede comprobar en la tienda: el peso o el volumen antes que la pieza, y la
 * pieza antes que la medida de cocina, que es la que no dice nada delante del
 * estante ("12 hojas" no es una cantidad de lechuga que se pueda pedir).
 */
const RANGO: Record<string, number> = {
  g: 3, kg: 3, ml: 3, cl: 3, l: 3,
  ud: 2,
}

const rangoDe = (unidad: string) => RANGO[normalizar(unidad)] ?? 1

/** La medida en la unidad de destino, o `null` si no son la misma magnitud. */
function enUnidadDe({ cantidad, unidad }: Medida, destino: string): number | null {
  if (normalizar(unidad) === normalizar(destino)) return cantidad
  return convertir(cantidad, unidad, destino)
}

export interface MedidasJuntas {
  principal: Medida
  /** Las que no se pueden sumar a la principal sin inventarse un factor. */
  otras: Medida[]
}

/**
 * Junta las medidas de un mismo ingrediente en una sola línea de la compra.
 *
 * Las que comparten magnitud se suman (250 g de un plato + 1 kg de otro = 1,25
 * kg). Las que no, no se convierten: una hoja de laurel y una hoja de lechuga
 * pesan cosas distintas, y el único factor honesto depende del producto. Se
 * quedan al lado de la principal, en la misma línea, porque el problema que
 * resuelve esto es que la misma lechuga salía dos veces en la lista.
 */
export function juntarMedidas(medidas: Medida[]): MedidasJuntas {
  const grupos: Medida[] = []
  for (const medida of medidas) {
    const grupo = grupos.find((g) => enUnidadDe(medida, g.unidad) != null)
    if (grupo) grupo.cantidad += enUnidadDe(medida, grupo.unidad)!
    else grupos.push({ ...medida })
  }

  grupos.sort((a, b) => rangoDe(b.unidad) - rangoDe(a.unidad) || b.cantidad - a.cantidad)
  const [principal, ...otras] = grupos
  return { principal: principal ?? { cantidad: 0, unidad: 'ud' }, otras }
}
