import { describe, it, expect, beforeAll } from 'vitest'
import sql from '../src/lib/db.js'
import { precioDe, buscarPrecio, PRECIOS } from '../../src/utils/precios.ts'
import { mismoIngrediente } from '../../src/utils/despensa.ts'

let recetas = []

beforeAll(async () => {
  recetas = await sql`
    SELECT id, nombre, precio_por_porcion::float AS precio, porciones, ingredientes
    FROM recetas WHERE borrada_en IS NULL ORDER BY nombre
  `
})

function apariciones() {
  return recetas.flatMap((r) => r.ingredientes)
}

describe('cobertura de la tabla de precios', () => {
  it('pone precio a la gran mayoría de las apariciones de ingrediente', () => {
    const todas = apariciones()
    const conPrecio = todas.filter((i) => precioDe(i) != null)
    const pct = (100 * conPrecio.length) / todas.length

    console.log(`\ncobertura: ${conPrecio.length}/${todas.length} apariciones (${pct.toFixed(1)}%)`)
    expect(pct).toBeGreaterThan(85)
  })

  it('cubre entera la parte cara: carnes, pescados y lácteos', () => {
    const caras = apariciones().filter((i) => ['carnes', 'pescados', 'lácteos'].includes(i.familia))
    const sinPrecio = [...new Set(caras.filter((i) => precioDe(i) == null).map((i) => i.nombre))]

    if (sinPrecio.length > 0) console.log('\nsin precio en familias caras:', sinPrecio.join(', '))
    expect(sinPrecio).toEqual([])
  })

  it('lista lo que queda sin precio, por impacto', () => {
    const conteo = new Map()
    for (const i of apariciones()) {
      if (precioDe(i) != null) continue
      conteo.set(i.nombre, (conteo.get(i.nombre) ?? 0) + 1)
    }
    const top = [...conteo.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)
    console.log('\nsin precio (top 15):')
    for (const [nombre, n] of top) console.log(`  ${String(n).padStart(3)}  ${nombre}`)
    expect(true).toBe(true)
  })

  it('no hay entradas duplicadas que se pisen entre sí', () => {
    const porClave = new Map()
    for (const p of PRECIOS) {
      const gemela = PRECIOS.find((otra) => mismoIngrediente(otra.nombre, p.nombre))
      porClave.set(gemela.nombre, (porClave.get(gemela.nombre) ?? []).concat(p.nombre))
    }
    const duplicados = [...porClave.values()].filter((nombres) => nombres.length > 1)
    expect(duplicados).toEqual([])
  })

  it('cada entrada se encuentra a sí misma, sin que otra más genérica la pise', () => {
    const malas = PRECIOS.filter((p) => buscarPrecio(p.nombre)?.nombre !== p.nombre).map((p) => p.nombre)
    expect(malas).toEqual([])
  })
})

describe('contraste contra los precios curados por el chef', () => {
  function comparar() {
    return recetas
      .map((r) => {
        const partes = r.ingredientes.map((i) => precioDe(i))
        if (partes.some((p) => p == null)) return null
        const calculado = partes.reduce((a, b) => a + b, 0) / (r.porciones ?? 1)
        return {
          id: r.id,
          nombre: r.nombre,
          curado: r.precio,
          calculado: Math.round(calculado * 100) / 100,
          desvio: (calculado - r.precio) / r.precio,
        }
      })
      .filter(Boolean)
  }

  it('la mediana de desviación se mantiene razonable', () => {
    const filas = comparar()
    const desvios = filas.map((f) => Math.abs(f.desvio)).sort((a, b) => a - b)
    const mediana = desvios[Math.floor(desvios.length / 2)]

    console.log(`\nrecetas comparables: ${filas.length}/${recetas.length}`)
    console.log(`desviación mediana: ${(100 * mediana).toFixed(1)}%`)
    expect(mediana).toBeLessThan(0.4)
  })

  it('lista las recetas que más se desvían, para revisarlas a mano', () => {
    const filas = comparar().sort((a, b) => Math.abs(b.desvio) - Math.abs(a.desvio))
    const sospechosas = filas.filter((f) => Math.abs(f.desvio) > 0.4)

    console.log(`\nrecetas con desvío > 40%: ${sospechosas.length}`)
    for (const f of sospechosas) {
      const signo = f.desvio > 0 ? '+' : ''
      console.log(`  ${f.id} ${signo}${(100 * f.desvio).toFixed(0).padStart(4)}% ${f.curado} -> ${f.calculado} ${f.nombre}`)
    }
    expect(true).toBe(true)
  })
})

describe('qué contrastar en Dirk y Lidl', () => {
  it('lista los ingredientes que más pesan en el gasto', () => {
    const porNombre = new Map()
    for (const r of recetas) {
      for (const i of r.ingredientes) {
        const precio = precioDe(i)
        if (precio == null || precio === 0) continue
        const previo = porNombre.get(i.nombre) ?? { euros: 0, n: 0 }
        porNombre.set(i.nombre, { euros: previo.euros + precio, n: previo.n + 1 })
      }
    }

    const ranking = [...porNombre.entries()]
      .map(([nombre, v]) => ({ nombre, ...v, entrada: buscarPrecio(nombre) }))
      .filter((x) => x.entrada && x.entrada.fuente === 'estimado')
      .sort((a, b) => b.euros - a.euros)
      .slice(0, 20)

    const totalRecetario = [...porNombre.values()].reduce((a, v) => a + v.euros, 0)
    const cubierto = ranking.reduce((a, x) => a + x.euros, 0)

    console.log(`\nlos 20 que más mueven (${(100 * cubierto / totalRecetario).toFixed(0)}% del gasto del recetario):`)
    for (const x of ranking) {
      console.log(
        `  ${x.euros.toFixed(0).padStart(4)} €  ${x.nombre.padEnd(28)} ` +
        `${x.entrada.euros} €/${x.entrada.unidad}  (en ${x.n} recetas)`
      )
    }
    expect(ranking.length).toBeGreaterThan(0)
  })
})
