import Marca from './Marca'

// Lo que se ve mientras se comprueba la sesión al arrancar. Sin spinner y sin
// texto a propósito: dura décimas y cualquier mensaje se lee como un error.
function Splash() {
  return (
    <div className="min-h-dvh bg-stone-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="animate-pulse">
        <Marca tamano={64} />
      </div>
    </div>
  )
}

export default Splash
