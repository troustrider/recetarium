import type { Variants } from 'framer-motion'

/**
 * El empuje lateral de siempre: la pantalla nueva entra desde la derecha y la
 * anterior se retira un cuarto hacia la izquierda, oscurecida. Al volver, cada
 * una deshace su camino.
 *
 * Es lo que hace cualquier aplicación de teléfono y lo que el gesto de deslizar
 * promete: si el dedo va hacia la derecha, la pantalla tiene que salir hacia la
 * derecha. El desplazamiento parcial de la que se queda debajo es lo que da la
 * sensación de pila —una encima de otra— en vez de dos pantallas sueltas.
 */
const PROFUNDAS = [/^\/recetas\//, /^\/admin\//]

/**
 * Si la pantalla cuelga de otra. El lateral significa profundidad: entrar en una
 * receta empuja, pero pasar del catálogo a la despensa es cambiar de sección y
 * ahí un deslizamiento no significa nada, así que esas se funden.
 */
export const esProfunda = (ruta: string) => PROFUNDAS.some((p) => p.test(ruta))

export const FUNDIDO: Variants = {
  entra: { opacity: 0 },
  quieta: { opacity: 1 },
  sale: { opacity: 0 },
}

export const PILA: Variants = {
  entra: (atras: boolean) => ({ x: atras ? '-28%' : '100%', opacity: atras ? 0.55 : 1 }),
  quieta: { x: '0%', opacity: 1 },
  sale: (atras: boolean) => ({ x: atras ? '100%' : '-28%', opacity: atras ? 1 : 0.55 }),
}
