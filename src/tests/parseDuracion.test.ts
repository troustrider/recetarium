import { describe, it, expect } from 'vitest'
import { parseDuraciones, formatReloj } from '../utils/parseDuracion'

describe('parseDuraciones', () => {
  it('lee minutos, segundos y horas', () => {
    expect(parseDuraciones('Cuece 12 min')).toEqual([{ segundos: 720, etiqueta: '12 min' }])
    expect(parseDuraciones('Marca 30 s por lado')).toEqual([{ segundos: 30, etiqueta: '30 s' }])
    expect(parseDuraciones('Hornea 2 horas')).toEqual([{ segundos: 7200, etiqueta: '2 h' }])
  })

  it('acepta las formas largas y abreviadas de cada unidad', () => {
    expect(parseDuraciones('reposa 5 minutos')[0].segundos).toBe(300)
    expect(parseDuraciones('reposa 5 minuto')[0].segundos).toBe(300)
    expect(parseDuraciones('espera 45 segundos')[0].segundos).toBe(45)
    expect(parseDuraciones('espera 45 seg')[0].segundos).toBe(45)
    expect(parseDuraciones('asa 1 h')[0].segundos).toBe(3600)
  })

  it('cronometra el mínimo de un rango pero conserva el rango en la etiqueta', () => {
    expect(parseDuraciones('Sofríe 25-30 min')).toEqual([{ segundos: 1500, etiqueta: '25-30 min' }])
    expect(parseDuraciones('Sofríe 8 – 10 min')).toEqual([{ segundos: 480, etiqueta: '8-10 min' }])
  })

  it('saca varias duraciones de un mismo paso, en orden', () => {
    const d = parseDuraciones('Sella 2 min por lado y hornea 20 min')
    expect(d.map((x) => x.segundos)).toEqual([120, 1200])
  })

  it('ignora los números que no llevan unidad de tiempo', () => {
    expect(parseDuraciones('Añade 200 g de arroz y 500 ml de caldo')).toEqual([])
    expect(parseDuraciones('Precalienta el horno a 180°C')).toEqual([])
    expect(parseDuraciones('Usa una sartén de 24 cm')).toEqual([])
  })

  it('no confunde palabras que empiezan por una unidad', () => {
    expect(parseDuraciones('Forma 4 hamburguesas')).toEqual([])
    expect(parseDuraciones('Añade 2 hojas de laurel')).toEqual([])
    expect(parseDuraciones('Corta en 3 tiras')).toEqual([])
  })

  it('devuelve lista vacía cuando el paso no tiene tiempos', () => {
    expect(parseDuraciones('Sala al gusto y sirve')).toEqual([])
  })
})

describe('formatReloj', () => {
  it('usa mm:ss por debajo de la hora', () => {
    expect(formatReloj(0)).toBe('0:00')
    expect(formatReloj(9)).toBe('0:09')
    expect(formatReloj(90)).toBe('1:30')
    expect(formatReloj(600)).toBe('10:00')
  })

  it('añade las horas cuando hacen falta', () => {
    expect(formatReloj(3600)).toBe('1:00:00')
    expect(formatReloj(3661)).toBe('1:01:01')
  })

  it('nunca muestra tiempo negativo', () => {
    expect(formatReloj(-5)).toBe('0:00')
  })

  it('redondea los segundos fraccionados', () => {
    expect(formatReloj(59.6)).toBe('1:00')
  })
})
