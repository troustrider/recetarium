import { describe, it, expect } from 'vitest'
import { normalizar, canonUnidad, claveIngrediente, formatNumero, formatCantidad } from '../utils/ingredientes'

// claveIngrediente es la que agrupa la lista de la compra y la que guarda el
// estado de "comprado". Si cambia su forma, se pierden los marcados.

describe('normalizar', () => {
  it('quita acentos, espacios y mayúsculas', () => {
    expect(normalizar('  Brócoli  ')).toBe('brocoli')
    expect(normalizar('ATÚN')).toBe('atun')
    expect(normalizar('Jamón Serrano')).toBe('jamon serrano')
  })

  it('también quita la eñe', () => {
    // No es un descuido: las claves de UNIDAD_CANON y los alias se escriben ya
    // sin ñ porque todo pasa por aquí antes.
    expect(normalizar('piña')).toBe('pina')
    expect(normalizar('puñado')).toBe('punado')
  })

  it('no toca los espacios interiores', () => {
    expect(normalizar('aceite  de   oliva')).toBe('aceite  de   oliva')
  })
})

describe('canonUnidad', () => {
  it('unifica abreviaturas y plurales', () => {
    expect(canonUnidad('harina', 'cda')).toBe('cucharada')
    expect(canonUnidad('harina', 'cdas')).toBe('cucharada')
    expect(canonUnidad('harina', 'cucharadas')).toBe('cucharada')
    expect(canonUnidad('harina', 'gr')).toBe('g')
    expect(canonUnidad('harina', 'gramos')).toBe('g')
    expect(canonUnidad('huevo', 'unidades')).toBe('ud')
    expect(canonUnidad('ajo', 'dientes')).toBe('diente')
  })

  it('convierte a "al gusto" los condimentos básicos, sea cual sea la unidad', () => {
    expect(canonUnidad('sal', 'g')).toBe('al gusto')
    expect(canonUnidad('pimienta', 'cda')).toBe('al gusto')
    expect(canonUnidad('Sal y pimienta', 'pizca')).toBe('al gusto')
  })

  it('convierte la unidad pizca en "al gusto"', () => {
    expect(canonUnidad('orégano', 'pizca')).toBe('al gusto')
    expect(canonUnidad('orégano', 'al gusto')).toBe('al gusto')
  })

  it('pero el plural "pizcas" se queda en pizca, no en "al gusto"', () => {
    // La comprobación de pizca va antes que la tabla de plurales, así que solo
    // atrapa el singular. Asimetría conocida.
    expect(canonUnidad('orégano', 'pizcas')).toBe('pizca')
  })

  it('deja pasar tal cual una unidad que no conoce', () => {
    expect(canonUnidad('masa', 'bloque')).toBe('bloque')
  })
})

describe('claveIngrediente', () => {
  it('agrupa el mismo ingrediente escrito de formas distintas', () => {
    expect(claveIngrediente('Brócoli', 'gr')).toBe(claveIngrediente('brocoli', 'gramos'))
    expect(claveIngrediente('Ajo', 'dientes')).toBe(claveIngrediente('ajo', 'diente'))
  })

  it('separa el mismo nombre con unidades de distinta naturaleza', () => {
    expect(claveIngrediente('tomate', 'ud')).not.toBe(claveIngrediente('tomate', 'g'))
  })

  it('junta sal y pimienta bajo "al gusto" venga como venga', () => {
    expect(claveIngrediente('sal', 'g')).toBe('sal__al gusto')
    expect(claveIngrediente('sal', 'cda')).toBe('sal__al gusto')
  })

  it('mantiene el formato nombre__unidad', () => {
    // El estado de comprados persiste esta cadena: cambiar el separador
    // invalida lo que el usuario ya había marcado.
    expect(claveIngrediente('pechuga de pollo', 'g')).toBe('pechuga de pollo__g')
  })
})

describe('formatNumero', () => {
  it('deja los enteros sin decimales', () => {
    expect(formatNumero(2)).toBe('2')
    expect(formatNumero(0)).toBe('0')
  })

  it('usa fracciones unicode en los cuartos y tercios', () => {
    expect(formatNumero(0.5)).toBe('½')
    expect(formatNumero(0.25)).toBe('¼')
    expect(formatNumero(0.75)).toBe('¾')
    expect(formatNumero(1 / 3)).toBe('⅓')
    expect(formatNumero(2 / 3)).toBe('⅔')
  })

  it('compone entero más fracción', () => {
    expect(formatNumero(1.5)).toBe('1½')
    expect(formatNumero(2.25)).toBe('2¼')
  })

  it('cae a decimal cuando la fracción no está en la tabla', () => {
    expect(formatNumero(2.4)).toBe('2.4')
    expect(formatNumero(0.1)).toBe('0.1')
  })
})

describe('formatCantidad', () => {
  it('omite la unidad en las piezas contadas', () => {
    expect(formatCantidad(2, 'ud')).toBe('2')
    expect(formatCantidad(0.5, 'ud')).toBe('½')
  })

  it('ignora la cantidad en lo que va al gusto', () => {
    expect(formatCantidad(1, 'al gusto')).toBe('al gusto')
    expect(formatCantidad(999, 'al gusto')).toBe('al gusto')
  })

  it('escribe cantidad y unidad en el resto', () => {
    expect(formatCantidad(300, 'g')).toBe('300 g')
    expect(formatCantidad(1.5, 'cucharada')).toBe('1½ cucharada')
  })
})
