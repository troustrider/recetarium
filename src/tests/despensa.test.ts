import { describe, it, expect } from 'vitest'
import { despensaCubre, mismoIngrediente, estaEnDespensa, faltantes, repartirDespensa, esDeHogar } from '../utils/despensa'
import { convertir, requiereCantidad } from '../utils/cantidades'
import type { Receta } from '../types/receta'

describe('despensaCubre — falsos negativos que rompían la disponibilidad', () => {
  it('ignora el conector "de" ("aceite oliva" ↔ "aceite de oliva")', () => {
    expect(despensaCubre('aceite oliva', 'aceite de oliva')).toBe(true)
    expect(despensaCubre('carne picada ternera', 'carne picada de ternera')).toBe(true)
    expect(despensaCubre('leche coco', 'leche de coco')).toBe(true)
    expect(despensaCubre('copos avena', 'copos de avena')).toBe(true)
  })

  it('un genérico de despensa cubre el corte específico de la receta', () => {
    expect(despensaCubre('pollo', 'pechuga de pollo')).toBe(true)
    expect(despensaCubre('pollo', 'contramuslos de pollo')).toBe(true)
    expect(despensaCubre('pollo', 'pollo picado')).toBe(true)
  })

  it('un específico de despensa cubre el genérico de la receta', () => {
    expect(despensaCubre('arroz jasmine', 'arroz')).toBe(true)
    expect(despensaCubre('tomate frito', 'tomate')).toBe(true)
    expect(despensaCubre('brócoli congelado', 'brócoli')).toBe(true)
  })

  it('tolera acentos y plurales', () => {
    expect(despensaCubre('atún', 'atun en lata al natural')).toBe(true)
    expect(despensaCubre('patatas', 'patata')).toBe(true)
    expect(despensaCubre('gambas congeladas', 'gambas')).toBe(true)
  })

  it('resuelve alias/variantes de escritura (tabla de alias)', () => {
    expect(despensaCubre('ketjap mani', 'kecap manis')).toBe(true)
    expect(despensaCubre('langostinos', 'gambas')).toBe(true)
    expect(despensaCubre('culantro', 'cilantro')).toBe(true)
    expect(despensaCubre('repollo', 'col')).toBe(true)
    expect(despensaCubre('cabbage', 'repollo')).toBe(true)
    expect(despensaCubre('coles', 'repollos')).toBe(true)
  })
})

describe('despensaCubre — no debe inventar disponibilidad', () => {
  it('no funde productos distintos que comparten cabeza', () => {
    expect(despensaCubre('aceite girasol', 'aceite de oliva')).toBe(false)
    expect(despensaCubre('salsa ajo', 'salsa de soja')).toBe(false)
    expect(despensaCubre('vino blanco', 'vino tinto')).toBe(false)
  })

  it('una cabeza ambigua genérica no cubre el específico', () => {
    expect(despensaCubre('leche', 'leche de coco')).toBe(false)
    expect(despensaCubre('harina', 'harina de almendra')).toBe(false)
    expect(despensaCubre('repollo', 'col rizada congelada')).toBe(false)
    expect(despensaCubre('cabbage', 'col china')).toBe(false)
  })

  it('ingredientes sin relación no casan', () => {
    expect(despensaCubre('pollo', 'salmón')).toBe(false)
    expect(despensaCubre('garbanzos', 'lentejas')).toBe(false)
  })
})

describe('mismoIngrediente — simétrico, para dedup de despensa y lista', () => {
  it('iguala variantes con conector/acento pero distingue descriptores', () => {
    expect(mismoIngrediente('aceite oliva', 'aceite de oliva')).toBe(true)
    expect(mismoIngrediente('arroz', 'arroz integral')).toBe(false)
    expect(mismoIngrediente('pollo', 'pechuga de pollo')).toBe(false)
  })
})

describe('faltantes / estaEnDespensa', () => {
  const receta: Receta = {
    id: '1', nombre: 'Pasta con pollo', categoria: 'x', sabor: 'salado',
    tiempoPreparacion: 20, favorita: false, pasos: [],
    ingredientes: [
      { nombre: 'pechuga de pollo', cantidad: 200, unidad: 'g', familia: 'carnes' },
      { nombre: 'aceite de oliva', cantidad: 1, unidad: 'cda', familia: 'otros' },
      { nombre: 'sal', cantidad: 1, unidad: 'al gusto', familia: 'especias' },
      { nombre: 'perejil', cantidad: 1, unidad: 'puñado', familia: 'verduras' },
    ],
  }
  const despensa = [{ nombre: 'pollo' }, { nombre: 'aceite oliva' }]

  it('cubre por cocina y descuenta "al gusto"; solo falta lo que no hay', () => {
    expect(faltantes(receta, despensa)).toEqual(['perejil'])
  })

  it('estaEnDespensa usa igualdad simétrica', () => {
    expect(estaEnDespensa('aceite de oliva', despensa)).toBe(true)
    expect(estaEnDespensa('pechuga de pollo', despensa)).toBe(false)
  })
})

describe('repartirDespensa — sin cantidades, manda el estado', () => {
  const hoy = new Date()
  const enDias = (n: number) => {
    const d = new Date(hoy)
    d.setDate(d.getDate() + n)
    return d.toISOString().slice(0, 10)
  }
  const pedir = (nombre: string, cantidad = 100, unidad = 'g') => [{ nombre, cantidad, unidad }]

  it('lleno cubre (con matching de cocina), ausente no', () => {
    const despensa = [{ nombre: 'pollo', estado: 'lleno' }]
    expect(repartirDespensa(pedir('pechuga de pollo'), despensa)[0].cobertura).toBe('cubierto')
    expect(repartirDespensa(pedir('salmón'), despensa)[0].cobertura).toBe('no')
  })

  it('estado poco se compra igualmente pero marcado', () => {
    const despensa = [{ nombre: 'arroz', estado: 'poco' }]
    const [r] = repartirDespensa(pedir('arroz'), despensa)
    expect(r.cobertura).toBe('poco')
    expect(r.aComprar).toBe(100)
  })

  it('lo que caduca pronto cuenta como poco aunque esté lleno', () => {
    const despensa = [{ nombre: 'leche', estado: 'lleno', caducidad: enDias(1) }]
    expect(repartirDespensa(pedir('leche', 200, 'ml'), despensa)[0].cobertura).toBe('poco')
  })

  it('caducidad lejana no penaliza', () => {
    const despensa = [{ nombre: 'huevos', estado: 'lleno', caducidad: enDias(20) }]
    expect(repartirDespensa(pedir('huevo', 2, 'ud'), despensa)[0].cobertura).toBe('cubierto')
  })
})

describe('repartirDespensa — con cantidades, resta lo que hay en casa', () => {
  it('con stock de sobra no se compra', () => {
    const despensa = [{ nombre: 'pollo', estado: 'lleno', cantidad: 1, unidad: 'kg' }]
    const [r] = repartirDespensa([{ nombre: 'pechuga de pollo', cantidad: 400, unidad: 'g' }], despensa)
    expect(r.cobertura).toBe('cubierto')
    expect(r.yaTengo).toBe(400)
  })

  it('con stock a medias solo se compra la diferencia', () => {
    const despensa = [{ nombre: 'arroz', estado: 'lleno', cantidad: 150, unidad: 'g' }]
    const [r] = repartirDespensa([{ nombre: 'arroz', cantidad: 400, unidad: 'g' }], despensa)
    expect(r).toEqual({ cobertura: 'parcial', aComprar: 250, yaTengo: 150 })
  })

  it('la cantidad manda sobre el estado "poco" marcado a mano', () => {
    const despensa = [{ nombre: 'leche', estado: 'poco', cantidad: 1, unidad: 'l' }]
    expect(repartirDespensa([{ nombre: 'leche', cantidad: 250, unidad: 'ml' }], despensa)[0].cobertura).toBe('cubierto')
  })

  it('a cero se compra entero', () => {
    const despensa = [{ nombre: 'lentejas', estado: 'lleno', cantidad: 0, unidad: 'g' }]
    expect(repartirDespensa([{ nombre: 'lentejas', cantidad: 200, unidad: 'g' }], despensa)[0].cobertura).toBe('no')
  })

  it('un mismo stock no cubre dos ingredientes a la vez', () => {
    const despensa = [{ nombre: 'pollo', estado: 'lleno', cantidad: 500, unidad: 'g' }]
    const reparto = repartirDespensa(
      [
        { nombre: 'pechuga de pollo', cantidad: 400, unidad: 'g' },
        { nombre: 'muslos de pollo', cantidad: 300, unidad: 'g' },
      ],
      despensa
    )
    expect(reparto[0].cobertura).toBe('cubierto')
    expect(reparto[1]).toEqual({ cobertura: 'parcial', aComprar: 200, yaTengo: 100 })
  })

  it('unidades no comparables caen al criterio por estado', () => {
    const despensa = [{ nombre: 'aceite de oliva', estado: 'lleno', cantidad: 500, unidad: 'ml' }]
    const [r] = repartirDespensa([{ nombre: 'aceite de oliva', cantidad: 2, unidad: 'cucharada' }], despensa)
    expect(r.cobertura).toBe('cubierto')
    expect(r.yaTengo).toBe(0)
  })
})

describe('repartirDespensa — con varios candidatos gana el que de verdad sirve', () => {
  it('el nombre exacto manda sobre el pariente que se está acabando', () => {
    const despensa = [
      { nombre: 'tomate frito', estado: 'poco', familia: 'conservas' },
      { nombre: 'tomate', estado: 'lleno', cantidad: 18, unidad: 'ud' },
      { nombre: 'tomate triturado', estado: 'lleno' },
    ]
    const [r] = repartirDespensa([{ nombre: 'tomate', cantidad: 2, unidad: 'ud' }], despensa)
    expect(r.cobertura).toBe('cubierto')
    expect(r.aComprar).toBe(0)
  })

  it('el orden en la despensa da igual', () => {
    const despensa = [
      { nombre: 'tomate', estado: 'lleno', cantidad: 18, unidad: 'ud' },
      { nombre: 'tomate frito', estado: 'poco' },
    ]
    expect(repartirDespensa([{ nombre: 'tomate', cantidad: 2, unidad: 'ud' }], despensa)[0].cobertura).toBe('cubierto')
  })

  it('el tomate triturado de una receta tira del triturado, no del tomate suelto', () => {
    const despensa = [
      { nombre: 'tomate', estado: 'lleno', cantidad: 18, unidad: 'ud' },
      { nombre: 'tomate triturado', estado: 'lleno', cantidad: 400, unidad: 'g' },
    ]
    const [r] = repartirDespensa([{ nombre: 'tomate triturado', cantidad: 300, unidad: 'g' }], despensa)
    expect(r).toEqual({ cobertura: 'cubierto', aComprar: 0, yaTengo: 300 })
  })

  it('si el exacto está a cero, tira del que sí tiene stock', () => {
    const despensa = [
      { nombre: 'arroz', estado: 'lleno', cantidad: 0, unidad: 'g' },
      { nombre: 'arroz basmati', estado: 'lleno', cantidad: 500, unidad: 'g' },
    ]
    expect(repartirDespensa([{ nombre: 'arroz', cantidad: 200, unidad: 'g' }], despensa)[0].cobertura).toBe('cubierto')
  })

  it('un solo candidato sigue mandando aunque esté acabándose', () => {
    const despensa = [{ nombre: 'tomate frito', estado: 'poco' }]
    expect(repartirDespensa([{ nombre: 'tomate', cantidad: 2, unidad: 'ud' }], despensa)[0].cobertura).toBe('poco')
  })
})

describe('cantidades — conversión y familias que la necesitan', () => {
  it('convierte dentro de la misma dimensión y solo ahí', () => {
    expect(convertir(1, 'kg', 'g')).toBe(1000)
    expect(convertir(250, 'ml', 'l')).toBe(0.25)
    expect(convertir(1, 'l', 'g')).toBeNull()
    expect(convertir(2, 'cucharada', 'ml')).toBeNull()
  })

  it('no mete la compra de casa en la despensa', () => {
    expect(esDeHogar({ nombre: 'detergente' })).toBe(true)
    expect(esDeHogar({ nombre: 'papel higiénico' })).toBe(true)
    expect(esDeHogar({ nombre: 'lavavajillas a mano' })).toBe(true)
    expect(esDeHogar({ nombre: 'lo que sea', familia: 'hogar' })).toBe(true)
    expect(esDeHogar({ nombre: 'lentejas' })).toBe(false)
    expect(esDeHogar({ nombre: 'papel de arroz' })).toBe(false)
  })

  it('pide cantidad donde cambia la compra, no en salsas ni especias', () => {
    expect(requiereCantidad('carnes')).toBe(true)
    expect(requiereCantidad('lácteos')).toBe(true)
    expect(requiereCantidad('lacteos')).toBe(true)
    expect(requiereCantidad('salsas')).toBe(false)
    expect(requiereCantidad('especias')).toBe(false)
    expect(requiereCantidad('condimentos')).toBe(false)
  })
})

describe('singular — plurales que el matcher no reconoce', () => {
  it('casa los plurales regulares', () => {
    expect(mismoIngrediente('huevo', 'huevos')).toBe(true)
    expect(mismoIngrediente('zanahoria', 'zanahorias')).toBe(true)
    expect(mismoIngrediente('limon', 'limones')).toBe(true)
    expect(mismoIngrediente('pan', 'panes')).toBe(true)
  })

  it('casa los acabados en -e', () => {
    expect(mismoIngrediente('tomate', 'tomates')).toBe(true)
    expect(mismoIngrediente('filete', 'filetes')).toBe(true)
    expect(mismoIngrediente('aguacate', 'aguacates')).toBe(true)
    expect(mismoIngrediente('jengibre', 'jengibres')).toBe(true)
  })

  it('casa los plurales en -ces', () => {
    expect(mismoIngrediente('nuez', 'nueces')).toBe(true)
    expect(mismoIngrediente('arroz', 'arroces')).toBe(true)
  })

  it('la despensa en plural cubre el ingrediente en singular de la receta', () => {
    expect(despensaCubre('tomates', 'tomate')).toBe(true)
    expect(despensaCubre('filetes de ternera', 'filete de ternera')).toBe(true)
    expect(despensaCubre('nueces', 'nuez')).toBe(true)
  })

  it('no funde palabras distintas que solo comparten raíz corta', () => {
    expect(mismoIngrediente('pato', 'pata')).toBe(false)
    expect(mismoIngrediente('lima', 'limon')).toBe(false)
    expect(mismoIngrediente('col', 'cola')).toBe(false)
  })
})
