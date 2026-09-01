import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { norm } from './nutricion.js'

const AQUI = dirname(fileURLToPath(import.meta.url))

export const CATALOGO = JSON.parse(readFileSync(resolve(AQUI, '../data/guarniciones.json'), 'utf8'))

export const GUARNICION_POR_NOMBRE = new Map(CATALOGO.guarniciones.map((g) => [g.nombre, g]))

export const FAMILIA_DE_COCINA = {}
for (const [familia, cocinas] of Object.entries(CATALOGO.familias))
  for (const cocina of cocinas) (FAMILIA_DE_COCINA[cocina] ??= []).push(familia)

// Bases aromáticas: están en familia verduras pero no son la verdura del plato.
export const RE_AROMATICA =
  /^(ajo|cebolla|cebolla roja|cebolleta|chalota|puerro|tomate triturado|tomate frito|passata|perejil|cilantro|albahaca|menta|cebollino|limon|lima|guindilla|chile jalapeno)$/

// Frutas que hacen de verdura en la mesa. Sin esto, una guarnición de aguacate
// no cuenta para la puerta de comida completa y el plato suspende en falso.
export const VERDURA_AUNQUE_FRUTA = new Set(['aguacate', 'tomate cherry'])

/**
 * Almidón de cuerpo: el que hace de base de la comida. Deja fuera la harina de
 * rebozar, el pan rallado y las pastas de especias, que no la sostienen.
 *
 * Va sin tildes y con `n` por `ñ` a propósito: se compara contra `norm()`, que
 * las quita. Tenerlo escrito dos veces, una acentuada y otra no, ya hizo que el
 * reparto colara arroz sobre un cuscús y la puerta lo cazara después.
 */
export const RE_ALMIDON_CUERPO =
  /^(arroz|arroz glutinoso|arroz arborio|pasta|espaguetis|macarrones|penne|tallarines|fideos|fideos de arroz|fideos de arroz planos|fideos de boniato|fideos ramen|noodles|udon|soba|pan|pan de pita|pan de centeno|baguette|patata|patatas fritas de horno|bulgur|cuscus|cuscus perla|orzo|quinoa|polenta|tortillas de trigo|tortillas de maiz|boniato|gnocchi|noquis|batata|platano macho|lasana|placas de lasana|freekeh|mochi|moghrabieh|maftoul)$/

export const esVerdura = (i) =>
  (i.familia === 'verduras' || VERDURA_AUNQUE_FRUTA.has(norm(i.nombre))) &&
  !RE_AROMATICA.test(norm(i.nombre)) &&
  !RE_ALMIDON_CUERPO.test(norm(i.nombre))

export const esAlmidonDeCuerpo = (i) => RE_ALMIDON_CUERPO.test(norm(i.nombre))

export const compatibleConCocina = (guarnicion, cocina) =>
  (guarnicion.cocinas ?? []).some(
    (c) => c === cocina || (FAMILIA_DE_COCINA[cocina] ?? []).includes(c)
  )
