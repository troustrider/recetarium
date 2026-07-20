import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import useFiltros from '../hooks/useFiltros'
import type { Receta } from '../types/receta'

const recetas: Receta[] = [
  {
    id: '1', nombre: 'Ceviche', categoria: 'Peruana', sabor: 'acido',
    tiempoPreparacion: 15, favorita: false,
    ingredientes: [], pasos: [],
  },
  {
    id: '2', nombre: 'Ramen', categoria: 'Japonesa', sabor: 'umami',
    tiempoPreparacion: 45, favorita: false,
    ingredientes: [], pasos: [],
  },
  {
    id: '3', nombre: 'Tortilla', categoria: 'Española', sabor: 'salado',
    tiempoPreparacion: 30, favorita: true,
    ingredientes: [
      { nombre: 'huevos', cantidad: 4, unidad: 'ud', familia: 'otros' },
      { nombre: 'patata', cantidad: 500, unidad: 'g', familia: 'verduras' },
    ],
    pasos: [],
  },
]

describe('useFiltros', () => {
  it('sin filtros devuelve todas las recetas', () => {
    const { result } = renderHook(() => useFiltros(recetas))
    expect(result.current.recetasFiltradas).toHaveLength(3)
  })

  it('filtra por sabor', () => {
    const { result } = renderHook(() => useFiltros(recetas))
    act(() => { result.current.setFiltros((f) => ({ ...f, sabor: 'umami' })) })
    expect(result.current.recetasFiltradas).toHaveLength(1)
    expect(result.current.recetasFiltradas[0].nombre).toBe('Ramen')
  })

  it('filtra por categoría', () => {
    const { result } = renderHook(() => useFiltros(recetas))
    act(() => { result.current.setFiltros((f) => ({ ...f, categoria: 'Española' })) })
    expect(result.current.recetasFiltradas).toHaveLength(1)
    expect(result.current.recetasFiltradas[0].nombre).toBe('Tortilla')
  })

  it('filtra por tiempoMax', () => {
    const { result } = renderHook(() => useFiltros(recetas))
    act(() => { result.current.setFiltros((f) => ({ ...f, tiempoMax: 30 })) })
    expect(result.current.recetasFiltradas).toHaveLength(2)
  })

  it('filtra por ingrediente con matching parcial y por tokens', () => {
    const { result } = renderHook(() => useFiltros(recetas))
    act(() => { result.current.setFiltros((f) => ({ ...f, ingrediente: 'pata' })) })
    expect(result.current.recetasFiltradas).toHaveLength(1)
    expect(result.current.recetasFiltradas[0].nombre).toBe('Tortilla')
    // singular casa con el plural de la receta vía tokens
    act(() => { result.current.setFiltros((f) => ({ ...f, ingrediente: 'huevo' })) })
    expect(result.current.recetasFiltradas).toHaveLength(1)
    act(() => { result.current.setFiltros((f) => ({ ...f, ingrediente: 'salmón' })) })
    expect(result.current.recetasFiltradas).toHaveLength(0)
  })

  it('resetFiltros devuelve todas las recetas', () => {
    const { result } = renderHook(() => useFiltros(recetas))
    act(() => { result.current.setFiltros((f) => ({ ...f, sabor: 'acido' })) })
    expect(result.current.recetasFiltradas).toHaveLength(1)
    act(() => { result.current.resetFiltros() })
    expect(result.current.recetasFiltradas).toHaveLength(3)
  })
})
