# Rutas

El enrutado usa React Router v7. Todas las rutas de la app quedan dentro del componente `Layout`, que añade la barra de navegación y el contenedor de página.

## Tabla de rutas

| Ruta | Página | Descripción |
|------|--------|-------------|
| `/` | `Catalogo` | Lista todas las recetas con filtros y botón de añadir a la lista de la compra |
| `/favoritas` | `Favoritas` | Lista solo las recetas marcadas como favoritas |
| `/planificador` | `Planificador` | Calendario semanal con drag & drop para asignar recetas a días |
| `/despensa` | `Despensa` | Inventario de ingredientes en casa, agrupados por familia |
| `/recetas/nueva` | `NuevaReceta` | Formulario de creación |
| `/recetas/:id` | `DetalleReceta` | Ingredientes, pasos, editar y eliminar |
| `/recetas/:id/editar` | `EditarReceta` | Formulario precargado con los datos de la receta |
| `/admin/sesiones` | `AdminSesiones` | Accesos e invitaciones. Solo para administradores |
| `*` | `NotFound` | Página 404 |

La lista de la compra **no tiene ruta**: es un drawer que se abre desde el carrito del header y desde la nav inferior en móvil.

Y por encima de todas ellas está la puerta: sin sesión no se monta ninguna, se ve la landing. Ver [design.md](design.md).

## Lazy loading

Todas las páginas se cargan con `React.lazy` y `Suspense`. Mientras se carga una página, se muestra `<LoadingSpinner />`.

## Layout

`Layout` recibe la página activa como `children`, no con `<Outlet />`: el shell es persistente y envuelve al `<Routes>`, así que la cabecera y la nav no se remontan al navegar. La navegación usa `<NavLink>` con la prop `end` en la ruta raíz para que no quede activa en rutas hijas.

## Árbol de rutas

```tsx
<Layout>
  <Suspense fallback={<LoadingSpinner />}>
    <Routes>
      <Route index element={<Catalogo />} />
      <Route path="favoritas" element={<Favoritas />} />
      <Route path="planificador" element={<Planificador />} />
      <Route path="despensa" element={<Despensa />} />
      <Route path="recetas/nueva" element={<NuevaReceta />} />
      <Route path="recetas/:id" element={<DetalleReceta />} />
      <Route path="recetas/:id/editar" element={<EditarReceta />} />
      <Route path="admin/sesiones" element={<AdminSesiones />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
</Layout>
```

## Navegación entre páginas

- Catálogo → Detalle: click en `RecetaCard`
- Catálogo → Nueva receta: botón "+ Nueva receta"
- Detalle → Editar: botón "Editar"
- Detalle → Catálogo: botón "Eliminar" (tras eliminar, con opción de deshacer)
- Formularios → atrás: `navigate(-1)` en "Cancelar"
