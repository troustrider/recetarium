import { MUESTRA } from '../../data/muestraLanding'

// Fondo de la landing: las fotos del recetario, desenfocadas, como textura.
//
// El texto NO va sobre fotografía. Encima hay una capa opaca del color de fondo
// de la app, así que el contraste de la tarjeta es el mismo que tendría sobre el
// fondo plano. Es la condición que se puso para poder usar fotos aquí.
function MosaicoLanding() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -inset-8 grid grid-cols-2 sm:grid-cols-4 gap-2 blur-2xl scale-110">
        {MUESTRA.map((r) => (
          <img
            key={r.nombre}
            src={r.imagen}
            alt=""
            // Sin lazy: es lo primero que se ve, diferirlo solo retrasa el
            // pintado. En MuestraTarjeta sí va, porque se oculta por debajo de lg.
            fetchPriority="low"
            decoding="async"
            className="w-full h-full object-cover opacity-70 dark:opacity-40"
          />
        ))}
      </div>

      {/* La capa que garantiza el contraste. Casi opaca: las fotos quedan como
          un rubor de color, no como una imagen que compita con el texto. */}
      <div className="absolute inset-0 bg-stone-50/92 dark:bg-gray-950/93" />

      {/* Y un poco más de peso hacia el centro, donde va la tarjeta. */}
      <div className="absolute inset-0 bg-gradient-to-b from-stone-50/60 via-stone-50/30 to-stone-50/70 dark:from-gray-950/70 dark:via-gray-950/40 dark:to-gray-950/80" />
    </div>
  )
}

export default MosaicoLanding
