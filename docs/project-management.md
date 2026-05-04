# Gestión del proyecto

## Metodología elegida

Para Recetarium uso **Kanban**. Es un proyecto individual, sin equipo ni fechas de sprint, así que no tiene sentido montar toda la estructura de Scrum. Con Kanban tengo un tablero visual donde cada funcionalidad avanza por columnas hasta estar terminada, y puedo ver de un vistazo en qué punto está todo.

## Tablero Trello

Enlace: https://trello.com/b/saQXnsUb/recetarium

### Columnas

- **Backlog** — todo lo que hay por hacer
- **Todo** — lo que toca hacer en este momento
- **In Progress** — en lo que estoy trabajando ahora
- **Review** — hecho, pero pendiente de probar
- **Done** — terminado y funciona

### Tarjetas

Cada tarjeta es una funcionalidad del proyecto. Las que tengo ahora en Backlog:

1. Crear receta
2. Ver catálogo de recetas
3. Ver detalle de receta
4. Editar receta
5. Borrar receta
6. Buscar y filtrar
7. Favoritas
8. Lista de la compra

Cada una tiene un checklist con las partes técnicas que hay que resolver:

- **Frontend**: componente, lógica de UI, conexión con la API
- **Backend**: endpoint, controlador, servicio
- **Capa de red**: qué manda el cliente, qué devuelve el servidor, cómo se gestionan los estados loading/error/data

## Cuándo considero algo terminado

Una tarjeta pasa a Done cuando el endpoint funciona, el frontend lo consume bien, no hay errores en consola y la funcionalidad se puede usar en el navegador.
