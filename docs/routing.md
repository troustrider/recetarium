# Rutas

El enrutado usa React Router v6. Todas las rutas de la app quedan dentro del componente `Layout`, que añade la barra de navegación y el contenedor de página. La ruta `*` (404) queda fuera para que no herede el layout.

## Tabla de rutas

| Ruta | Página | Descripción |
|------|--------|-------------|
| `/` | `Catalogo` | Lista todas las recetas con filtros y botón de añadir a la lista de la compra |
| `/favoritas` | `Favoritas` | Lista solo las recetas marcadas como favoritas |
| `/recetas/nueva` | `NuevaReceta` | Formulario de creación |
| `/recetas/:id` | `DetalleReceta` | Ingredientes, pasos, editar y eliminar |
| `/recetas/:id/editar` | `EditarReceta` | Formulario precargado con los datos de la receta |
| `/lista-compra` | `ListaCompra` | Ingredientes fusionados de las recetas seleccionadas |
| `*` | `NotFound` | Página 404 |

## Layout

`Layout` usa `<Outlet />` de React Router para renderizar la página activa. La barra de navegación usa `<NavLink>` con la prop `end` en `/` para que no quede activa en rutas hijas.

## Árbol de rutas

```tsx
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
```

## Navegación entre páginas

- Catálogo → Detalle: click en `RecetaCard`
- Catálogo → Nueva receta: botón "+ Nueva receta"
- Detalle → Editar: botón "Editar"
- Detalle → Catálogo: botón "Eliminar" (tras eliminar)
- Formularios → atrás: `navigate(-1)` en "Cancelar"
