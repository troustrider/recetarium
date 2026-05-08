# Gestión del proyecto

## Metodología elegida

Para Recetarium uso **Kanban**. Es un proyecto individual, sin equipo ni fechas de sprint, así que no tiene sentido montar toda la estructura de Scrum. Con Kanban tengo un tablero visual donde cada funcionalidad avanza por columnas hasta estar terminada.

## Tablero Trello

Enlace: https://trello.com/b/saQXnsUb/recetarium

### Columnas

- **Backlog** — todo lo que hay por hacer
- **Todo** — lo que toca hacer en este momento
- **In Progress** — en lo que estoy trabajando ahora
- **Review** — hecho, pero pendiente de probar
- **Done** — terminado y funciona

## Funcionalidades completadas

1. Catálogo de recetas con filtros por categoría y sabor
2. Crear, editar y borrar recetas
3. Detalle de receta con ingredientes y pasos
4. Favoritas
5. Lista de la compra unificada con raciones por receta
6. Planificador semanal con drag & drop (sincronizado con la lista de la compra)
7. Despensa con inventario por familia de ingrediente
8. Modo oscuro
9. API REST completa (6 endpoints) con Swagger UI en `/api/docs`
10. Despliegue en Vercel: https://recetarium-one.vercel.app

## Cuándo considero algo terminado

Una tarjeta pasa a Done cuando el endpoint funciona, el frontend lo consume bien, no hay errores en consola y la funcionalidad se puede usar en el navegador.
