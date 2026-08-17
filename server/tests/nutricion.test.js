import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { arrancarServidor, api, crearSesion, recetaValida } from './helpers.js'
import { estimarMacros, fichaNutricional } from '../src/lib/nutricion.js'

let servidor
let http

beforeAll(async () => {
  servidor = await arrancarServidor()
  http = api(servidor.base, (await crearSesion()).token)
})

afterAll(() => servidor.cerrar())

const ing = (nombre, cantidad, unidad = 'g', familia = 'otros') => ({ nombre, cantidad, unidad, familia })

describe('estimación de micronutrientes', () => {
  it('divide entre porciones igual que los macros', () => {
    const uno = fichaNutricional({ porciones: 1, ingredientes: [ing('espinacas', 200, 'g', 'verduras')] })
    const dos = fichaNutricional({ porciones: 2, ingredientes: [ing('espinacas', 200, 'g', 'verduras')] })
    expect(uno.hierro).toBeCloseTo(5.4, 1)
    expect(dos.hierro).toBeCloseTo(2.7, 1)
    expect(dos.micros.folato).toBe(Math.round(uno.micros.folato / 2))
  })

  it('separa el hierro hemo del vegetal', () => {
    const carne = fichaNutricional({ porciones: 1, ingredientes: [ing('filete de ternera', 200, 'g', 'carnes')] })
    expect(carne.micros.hierroHemo).toBeCloseTo(carne.hierro, 1)

    const lentejas = fichaNutricional({ porciones: 1, ingredientes: [ing('lentejas', 100, 'g', 'legumbres')] })
    expect(lentejas.hierro).toBeGreaterThan(5)
    expect(lentejas.micros.hierroHemo).toBe(0)
  })

  it('detecta el gluten escondido en la salsa de soja y propone sustituto', () => {
    const f = fichaNutricional({ porciones: 2, ingredientes: [ing('arroz', 200, 'g', 'cereales'), ing('salsa de soja', 2, 'cucharada', 'salsas')] })
    expect(f.sinGluten).toBe(false)
    expect(f.micros.gluten.fuentes).toEqual([
      { nombre: 'salsa de soja', certeza: 'si', sustituto: 'tamari sin gluten' },
    ])
    expect(f.micros.gluten.evitable).toBe(true)
  })

  it('marca la avena como dudosa, no como libre', () => {
    const f = fichaNutricional({ porciones: 1, ingredientes: [ing('avena', 60, 'g', 'cereales')] })
    expect(f.sinGluten).toBe(false)
    expect(f.micros.gluten.fuentes[0].certeza).toBe('depende')
  })

  it('afirma sin gluten solo cuando conoce todos los ingredientes', () => {
    const conocidos = fichaNutricional({ porciones: 1, ingredientes: [ing('arroz', 200, 'g', 'cereales')] })
    expect(conocidos.sinGluten).toBe(true)

    const desconocido = fichaNutricional({ porciones: 1, ingredientes: [ing('polvo de estrellas', 10, 'g')] })
    expect(desconocido.sinGluten).toBeNull()
  })

  it('detecta el gluten aunque no pueda pesar el ingrediente', () => {
    const f = fichaNutricional({ porciones: 1, ingredientes: [ing('pan de pita', 2, 'paquete', 'cereales')] })
    expect(f.sinGluten).toBe(false)
    expect(f.micros.estimadoDe).toBe('parcial')
  })

  it('no cuenta las especias de la lista de ignorados', () => {
    const e = estimarMacros({ porciones: 1, ingredientes: [ing('sal', 1, 'pizca', 'especias'), ing('laurel', 1, 'hoja', 'especias')] })
    expect(e.desconocidos).toEqual([])
    expect(e.hierro).toBe(0)
  })
})

describe('origen animal', () => {
  const apto = (...ingredientes) =>
    fichaNutricional({ porciones: 2, ingredientes: ingredientes.map((n) => ing(n, 100, 'g')) }).apto

  it('un plato de legumbre y verdura es vegetariano y vegano', () => {
    const a = apto('lentejas cocidas de bote', 'zanahoria', 'aceite de oliva')
    expect(a.vegetariana).toBe(true)
    expect(a.vegana).toBe(true)
    expect(a.animal).toEqual([])
  })

  it('el queso deja de ser vegano pero sigue siendo vegetariano', () => {
    const a = apto('espaguetis', 'parmesano rallado')
    expect(a.vegetariana).toBe(true)
    expect(a.vegana).toBe(false)
    expect(a.animal).toEqual([{ nombre: 'parmesano rallado', origen: 'lacteo', certeza: 'si' }])
  })

  it('pilla el pescado escondido en el dashi, que no está en la familia pescados', () => {
    const a = apto('fideos ramen', 'caldo dashi')
    expect(a.vegetariana).toBe(false)
    expect(a.animal).toEqual([{ nombre: 'caldo dashi', origen: 'pescado', certeza: 'si' }])
  })

  it('lo que depende de la marca no se da por apto: queda en no se puede afirmar', () => {
    const a = apto('arroz', 'kimchi')
    expect(a.vegetariana).toBe(null)
    expect(a.animal[0]).toMatchObject({ nombre: 'kimchi', certeza: 'depende' })
  })

  it('un ingrediente sin ficha deja la receta sin afirmar, no apta por defecto', () => {
    const a = apto('arroz', 'polvo de estrellas')
    expect(a.vegetariana).toBe(null)
    expect(a.vegana).toBe(null)
  })
})

describe('la API calcula la ficha, no la acepta del cliente', () => {
  it('rellena hierro, sinGluten y micros al crear', async () => {
    const res = await http.post('/recetas', recetaValida({
      nombre: 'Nutrición alta en hierro',
      ingredientes: [ing('lentejas', 200, 'g', 'legumbres'), ing('pimiento rojo', 150, 'g', 'verduras')],
      porciones: 2,
    }))
    expect(res.status).toBe(201)
    const creada = await res.json()
    expect(creada.hierro).toBeGreaterThan(5)
    expect(creada.sinGluten).toBe(true)
    expect(creada.micros.vitaminaC).toBeGreaterThan(90)
    await http.del(`/recetas/${creada.id}`)
  })

  it('ignora el hierro y el gluten que venga en el payload', async () => {
    const res = await http.post('/recetas', recetaValida({
      nombre: 'Nutrición mentirosa',
      ingredientes: [ing('pasta', 200, 'g', 'cereales')],
      porciones: 2,
      hierro: 99,
      sinGluten: true,
    }))
    expect(res.status).toBe(201)
    const creada = await res.json()
    expect(creada.hierro).toBeLessThan(5)
    expect(creada.sinGluten).toBe(false)
    await http.del(`/recetas/${creada.id}`)
  })

  it('recalcula la ficha cuando cambian los ingredientes', async () => {
    const res = await http.post('/recetas', recetaValida({
      nombre: 'Nutrición editable',
      ingredientes: [ing('pasta', 200, 'g', 'cereales')],
      porciones: 2,
    }))
    const creada = await res.json()
    expect(creada.sinGluten).toBe(false)

    const editada = await (await http.put(`/recetas/${creada.id}`, recetaValida({
      nombre: 'Nutrición editable',
      ingredientes: [ing('fideos de arroz', 200, 'g', 'cereales')],
      porciones: 2,
    }))).json()
    expect(editada.sinGluten).toBe(true)
    expect(editada.micros.gluten).toBeNull()
    await http.del(`/recetas/${creada.id}`)
  })
})
