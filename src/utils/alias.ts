// Sinónimos que el matcher por tokens no puede deducir (no son plural ni acento,
// son palabras distintas para lo mismo). Clave = variante, valor = canónico.
// Ampliar cuando una receta marque como "falta" algo que sí tienes escrito de
// otra forma en la despensa.
export const ALIAS_TOKENS: Record<string, string> = {
  ketjap: 'kecap', // ketjap manis (grafía NL) = kecap manis
  kwark: 'quark', // grafía NL del quark
  langostino: 'gamba',
  gambon: 'gamba',
  culantro: 'cilantro',
  palta: 'aguacate',
  choclo: 'maiz',
  repollo: 'col',
  cabbage: 'col',
}
