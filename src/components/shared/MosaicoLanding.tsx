import { MUESTRA } from '../../data/muestraLanding'

function MosaicoLanding() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -inset-8 grid grid-cols-2 sm:grid-cols-4 gap-2 blur-2xl scale-110">
        {MUESTRA.map((r) => (
          <img
            key={r.nombre}
            src={r.imagen}
            alt=""
            fetchPriority="low"
            decoding="async"
            className="w-full h-full object-cover opacity-70 dark:opacity-40"
          />
        ))}
      </div>

      <div className="absolute inset-0 bg-stone-50/92 dark:bg-gray-950/93" />

      <div className="absolute inset-0 bg-gradient-to-b from-stone-50/60 via-stone-50/30 to-stone-50/70 dark:from-gray-950/70 dark:via-gray-950/40 dark:to-gray-950/80" />
    </div>
  )
}

export default MosaicoLanding
