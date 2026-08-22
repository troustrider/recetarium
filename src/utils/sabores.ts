import type { Sabor } from '../types/receta'

export const SABOR_BG: Record<Sabor, string> = {
  salado: '#041524',  // abismo oceánico
  dulce:  '#2d0412',  // cereza macerada
  amargo: '#1a1000',  // espresso oscuro
  umami:  '#130c1a',  // berenjena fermentada
  acido:  '#0c1a00',  // lima nocturna
}

export const LUZ: Record<Sabor, { bg: string; bloom: string; dot: string }> = {
  salado: { bg: '#082A45', bloom: 'rgba(56,189,248,0.30)', dot: '#38bdf8' },
  dulce:  { bg: '#3A0A1E', bloom: 'rgba(251,113,133,0.30)', dot: '#fb7185' },
  amargo: { bg: '#2A1B02', bloom: 'rgba(251,191,36,0.24)', dot: '#fbbf24' },
  umami:  { bg: '#1E1030', bloom: 'rgba(192,132,252,0.32)', dot: '#c084fc' },
  acido:  { bg: '#14300E', bloom: 'rgba(163,230,53,0.26)', dot: '#a3e635' },
}

