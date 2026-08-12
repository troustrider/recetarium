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

// Nombres completos que designan el mismo producto. A diferencia de ALIAS_TOKENS
// se aplican al nombre entero, para poder colapsar variedades que solo se
// distinguen por el adjetivo ("col blanca" = "col") sin tratar ese adjetivo como
// genérico: la col china y la rizada siguen siendo otra cosa.
export const ALIAS_NOMBRES: Record<string, string> = {
  col: 'col',
  coles: 'col',
  'col blanca': 'col',
  'coles blancas': 'col',
  'col verde': 'col',
  'coles verdes': 'col',
  repollo: 'col',
  repollos: 'col',
  'repollo blanco': 'col',
  'repollo verde': 'col',
}
