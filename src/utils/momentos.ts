import type { RecetaListada, Tipo } from '../types/receta'

/**
 * Los tres huecos de comer del día. Hasta ahora el plan solo distinguía dos, y
 * ni siquiera de forma explícita: lo que no era `tipo: 'desayuno'` era la cena,
 * porque es lo único que la auto-semana repartía. El momento lo dice la entrada
 * del plan y no la receta, que es la diferencia importante: una tortilla de
 * patatas es la misma receta a mediodía y por la noche, y quién decide cuándo
 * se come es la semana, no el recetario.
 */
export const MOMENTOS = ['desayuno', 'comida', 'cena'] as const

export type Momento = typeof MOMENTOS[number]

export const NOMBRE_MOMENTO: Record<Momento, string> = {
  desayuno: 'Desayuno',
  comida: 'Comida',
  cena: 'Cena',
}

/** Para ordenar el día como se vive: desayuno, comida y cena. */
export const ORDEN_MOMENTO: Record<Momento, number> = { desayuno: 0, comida: 1, cena: 2 }

export const esMomento = (valor: unknown): valor is Momento =>
  typeof valor === 'string' && (MOMENTOS as readonly string[]).includes(valor)

/**
 * Dónde cae una receta cuando nadie lo ha dicho. Los desayunos, en su hueco;
 * todo lo demás en la cena, que es lo que el planificador ha estado repartiendo
 * desde el principio: así un plan guardado antes de que existiera el hueco de
 * comida se lee hoy exactamente como se leía ayer.
 */
export function momentoPorDefecto(tipo?: Tipo): Momento {
  return tipo === 'desayuno' ? 'desayuno' : 'cena'
}

export function momentoDe(entrada: { momento?: Momento; receta: Pick<RecetaListada, 'tipo'> }): Momento {
  return entrada.momento ?? momentoPorDefecto(entrada.receta.tipo)
}

/** El siguiente en la rueda, para cambiar de momento de un toque en el chip. */
export function siguienteMomento(momento: Momento): Momento {
  return MOMENTOS[(MOMENTOS.indexOf(momento) + 1) % MOMENTOS.length]
}

/**
 * Lo que deja un plato fuera de la cena. No es una regla metabólica: lo que
 * sostiene la evidencia es que las comidas grandes y grasas en las dos o tres
 * horas previas a dormir empeoran el sueño y el reflujo, y nada más. Lo demás
 * que suele decirse de la cena —que el carbohidrato de noche engorda, que hay
 * platos que "son" de día— no tiene con qué defenderse.
 *
 * Los dos números son un corte de conveniencia sobre este recetario y no un
 * umbral clínico: parten los principales casi por la mitad, así que dejan sitio
 * de sobra para llenar siete cenas y mandan los platos pesados al hueco donde
 * caben, que es la comida. El fundamento completo, en la skill del chef
 * (`references/momentos-del-dia.md`).
 */
export const TOPE_CENA = { calorias: 950, grasas: 35 } as const

type ConMacros = Pick<RecetaListada, 'calorias' | 'grasas' | 'guarnicion'>

export function cabeDeNoche(receta: ConMacros): boolean {
  // La guarnición cuenta porque es lo que se come. Un plato sin macros
  // declarados pasa: no hay dato que le impute nada, y descartarlo por no
  // traerlo sería castigar a la receta vieja en vez de a la pesada.
  const calorias = (receta.calorias ?? 0) + (receta.guarnicion?.calorias ?? 0)
  const grasas = (receta.grasas ?? 0) + (receta.guarnicion?.grasas ?? 0)
  return calorias <= TOPE_CENA.calorias && grasas <= TOPE_CENA.grasas
}
