import Marca from './Marca'

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
