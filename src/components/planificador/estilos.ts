import type { Momento } from '../../utils/momentos'
import type { Sabor } from '../../types/receta'
import { Sunrise, Sun, Moon } from 'lucide-react'

export const MOMENTO_ESTILO: Record<Momento, {
  Icono: typeof Sunrise
  texto: string
  chip: string
  boton: string
}> = {
  desayuno: {
    Icono: Sunrise,
    texto: 'text-amber-600 dark:text-amber-400',
    chip: 'bg-amber-50/80 dark:bg-amber-950/25 border-amber-200/80 dark:border-amber-900/50',
    boton: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/70',
  },
  comida: {
    Icono: Sun,
    texto: 'text-teal-600 dark:text-teal-400',
    chip: 'bg-teal-50/80 dark:bg-teal-950/25 border-teal-200/80 dark:border-teal-900/50',
    boton: 'bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 hover:bg-teal-200 dark:hover:bg-teal-900/70',
  },
  cena: {
    Icono: Moon,
    texto: 'text-indigo-500 dark:text-indigo-400',
    chip: 'bg-indigo-50/80 dark:bg-indigo-950/25 border-indigo-200/80 dark:border-indigo-900/50',
    boton: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/70',
  },
}

export const SABOR_STRIP: Record<Sabor, string> = {
  salado: 'bg-sky-500',
  dulce:  'bg-rose-400',
  amargo: 'bg-amber-600',
  umami:  'bg-purple-500',
  acido:  'bg-lime-500',
}

export const SABOR_TEXT: Record<Sabor, string> = {
  salado: 'text-sky-400',
  dulce:  'text-rose-400',
  amargo: 'text-amber-500',
  umami:  'text-purple-400',
  acido:  'text-lime-400',
}
