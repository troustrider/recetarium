// Tabla de alias de ingredientes: variantes de escritura y sinónimos que el
// matcher por tokens NO puede deducir por su cuenta (no son plural ni acento,
// son palabras distintas para lo mismo). Se aplica token a token, sobre la
// forma ya normalizada y en singular.
//
// Clave = token variante · Valor = token canónico.
// Ampliar aquí cuando una receta marque como "falta" un ingrediente que sí
// tienes escrito de otra forma en la despensa.
export const ALIAS_TOKENS: Record<string, string> = {
  ketjap: 'kecap', // ketjap manis (grafía NL) = kecap manis
  langostino: 'gamba',
  gambon: 'gamba',
  culantro: 'cilantro',
  palta: 'aguacate',
  choclo: 'maiz',
}

export function aplicarAlias(token: string): string {
  return ALIAS_TOKENS[token] ?? token
}
