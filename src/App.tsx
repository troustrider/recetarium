import { Routes, Route } from 'react-router-dom'
import Layout from './components/shared/Layout'
import Catalogo from './pages/Catalogo'
import Favoritas from './pages/Favoritas'
import DetalleReceta from './pages/DetalleReceta'
import NuevaReceta from './pages/NuevaReceta'
import EditarReceta from './pages/EditarReceta'
import ListaCompra from './pages/ListaCompra'
import NotFound from './pages/NotFound'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Catalogo />} />
        <Route path="/favoritas" element={<Favoritas />} />
        <Route path="/lista-compra" element={<ListaCompra />} />
        <Route path="/recetas/nueva" element={<NuevaReceta />} />
        <Route path="/recetas/:id" element={<DetalleReceta />} />
        <Route path="/recetas/:id/editar" element={<EditarReceta />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
