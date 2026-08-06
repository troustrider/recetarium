import { test } from 'vitest'
import { mismoIngrediente } from './src/utils/despensa'
import { buscarPrecio } from './src/utils/precios'

test('match', () => {
  console.log('mismoIngrediente:', mismoIngrediente('curry rojo en pasta', 'pasta de curry rojo'))
  console.log('buscarPrecio(pasta de curry rojo):', buscarPrecio('pasta de curry rojo')?.nombre ?? null)
  console.log('buscarPrecio(pasta de curry japones):', buscarPrecio('pasta de curry japonés')?.nombre ?? null)
})
