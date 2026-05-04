import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <main className="p-8 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2 text-gray-600">Página no encontrada.</p>
      <Link to="/" className="mt-4 inline-block text-blue-600 underline">
        Volver al inicio
      </Link>
    </main>
  )
}

export default NotFound
