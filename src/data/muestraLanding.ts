// Muestra para la landing. Va como constante y no desde la API a propósito: la
// landing es lo único que se ve sin sesión, y todos los endpoints de recetas
// exigen sesión. Abrir uno público para decorar una pantalla sería deshacer lo
// que se cerró en la fase 4.
//
// La selección es curada, no un SELECT cualquiera: unas treinta recetas del
// catálogo tienen foto de relleno porque Unsplash no tiene el plato, y aquí no
// pueden salir. Si alguna deja de gustar, se cambia esta lista y ya.
export interface MuestraReceta {
  nombre: string
  categoria: string
  minutos: number
  proteinas: number
  imagen: string
}

export const MUESTRA: MuestraReceta[] = [
  {
    nombre: 'Katsudon',
    categoria: 'japonesa',
    minutos: 30,
    proteinas: 59,
    imagen:
      'https://images.unsplash.com/photo-1624517607896-bb5dfd8f5764?ixid=M3w5OTQwNDl8MHwxfHNlYXJjaHwxfHxrYXRzdWRvbiUyMGZvb2R8ZW58MXwwfHx8MTc4MzQzMzM4OHww&ixlib=rb-4.1.0&w=800&q=80&fit=crop&crop=entropy',
  },
  {
    nombre: 'Ramen de pollo',
    categoria: 'japonesa',
    minutos: 50,
    proteinas: 65,
    imagen: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80&crop=entropy',
  },
  {
    nombre: 'Hamburguesa smash',
    categoria: 'americana',
    minutos: 25,
    proteinas: 57,
    imagen: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80&crop=entropy',
  },
  {
    nombre: 'Pollo kung pao',
    categoria: 'china',
    minutos: 35,
    proteinas: 50,
    imagen:
      'https://images.unsplash.com/photo-1605704922285-e82455dba38b?ixid=M3w5OTQwNDl8MHwxfHNlYXJjaHwxfHxrdW5nJTIwcGFvJTIwY2hpY2tlbnxlbnwxfDB8fHwxNzgzNTQzMTk4fDA&ixlib=rb-4.1.0&w=800&q=80&fit=crop&crop=entropy',
  },
  {
    nombre: 'Pollo turco especiado',
    categoria: 'turca',
    minutos: 35,
    proteinas: 51,
    imagen:
      'https://images.unsplash.com/photo-1697155836250-e3ba3a24fbd5?ixid=M3w5OTQwNDl8MHwxfHNlYXJjaHw1fHxjaGlja2VuJTIwdHVya2lzaCUyMGZvb2R8ZW58MXwwfHx8MTc4MzUyMjkyMnww&ixlib=rb-4.1.0&w=800&q=80&fit=crop&crop=entropy',
  },
  {
    nombre: 'Pollo satay',
    categoria: 'indonesia',
    minutos: 25,
    proteinas: 54,
    imagen:
      'https://images.unsplash.com/photo-1772855386828-a18ff9a12584?ixid=M3w5OTQwNDl8MHwxfHNlYXJjaHwzfHxjaGlja2VuJTIwc2F0YXklMjBmb29kfGVufDF8MHx8fDE3ODM1MjI5MTd8MA&ixlib=rb-4.1.0&w=800&q=80&fit=crop&crop=entropy',
  },
  {
    nombre: 'Pollo a la parmesana',
    categoria: 'italiana',
    minutos: 40,
    proteinas: 69,
    imagen:
      'https://images.unsplash.com/photo-1773756606644-bbbb1bd16b87?ixid=M3w5OTQwNDl8MHwxfHNlYXJjaHwyfHxjaGlja2VuJTIwcGFybWVzYW4lMjBmb29kfGVufDF8MHx8fDE3ODUxODAxNjd8MA&ixlib=rb-4.1.0&w=800&q=80&fit=crop&crop=entropy',
  },
  {
    nombre: 'Quesadillas de pollo',
    categoria: 'mexicana',
    minutos: 25,
    proteinas: 52,
    imagen:
      'https://images.unsplash.com/photo-1777013485814-288099531e5a?ixid=M3w5OTQwNDl8MHwxfHNlYXJjaHwzfHxxdWVzYWRpbGxhJTIwY2hpY2tlbiUyMGJlYW5zJTIwZm9vZHxlbnwxfDB8fHwxNzgzNTIyOTI2fDA&ixlib=rb-4.1.0&w=800&q=80&fit=crop&crop=entropy',
  },
]
