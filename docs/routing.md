# Rutas

El enrutado usa React Router v7. Todas las rutas de la app quedan dentro del componente `Layout`, que añade la barra de navegación y el contenedor de página.

## Tabla de rutas

| Ruta | Página | Descripción |
|------|--------|-------------|
| `/` | `Catalogo` | Lista todas las recetas con filtros y botón de añadir a la lista de la compra |
| `/favoritas` | `Favoritas` | Lista solo las recetas marcadas como favoritas |
| `/lista-compra` | `ListaCompra` | Ingredientes fusionados de las recetas seleccionadas |
| `/planificador` | `Planificador` | Calendario semanal con drag & drop para asignar recetas a días |
| `/despensa` | `Despensa` | Inventario de ingredientes en casa, agrupados por familia |
| `/recetas/nueva` | `NuevaReceta` | Formulario de creación |
| `/recetas/:id` | `DetalleReceta` | Ingredientes, pasos, editar y eliminar |
| `/recetas/:id/editar` | `EditarReceta` | Formulario precargado con los datos de la receta |
| `*` | `NotFound` | Página 404 |

## Lazy loading

Todas las páginas se cargan con `React.lazy` y `Suspense`. Mientras se carga una página, se muestra `<LoadingSpinner />`.

## Layout

`Layout` usa `<Outlet />` de React Router para renderizar la página activa. La barra de navegación usa `<NavLink>` con la prop `end` en la ruta raíz para que no quede activa en rutas hijas.

## Árbol de rutas

```tsx
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route element={<Layout />}>
      <Route index element={<Catalogo />} />
      <Route path="favoritas" element={<Favoritas />} />
      <Route path="lista-compra" element={<ListaCompra />} />
      <Route path="planificador" element={<Planificador />} />
      <Route path="despensa" element={<Despensa />} />
      <Route path="recetas/nueva" element={<NuevaReceta />} />
      <Route path="recetas/:id" element={<DetalleReceta />} />
      <Route path="recetas/:id/editar" element={<EditarReceta />} />
      <Route path="*" element={<NotFound />} />
    </Route>
  </Routes>
</Suspense>
```

## Navegación entre páginas

- Catálogo → Detalle: click en `RecetaCard`
- Catálogo → Nueva receta: botón "+ Nueva receta"
- Detalle → Editar: botón "Editar"
- Detalle → Catálogo: botón "Eliminar" (tras eliminar)
- Formularios → atrás: `navigate(-1)` en "Cancelar"
