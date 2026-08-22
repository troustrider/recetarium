import { convertir } from './cantidades'
import { normalizar } from './ingredientes'

export interface Medida {
  cantidad: number
  unidad: string
}

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

interface MedidasJuntas {
  principal: Medida
  /** Las que no se pueden sumar a la principal sin inventarse un factor. */
  otras: Medida[]
}

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
