# Formularios

## El componente RecetaForm

Hay un único formulario en la app: `RecetaForm`. Se usa tanto para crear recetas nuevas como para editarlas. Cuando se usa para editar, recibe los datos existentes en la prop `inicial` y los pre-carga. Cuando no recibe nada, arranca en blanco.

El componente acepta tres props:
- `inicial` — datos de la receta a editar (opcional)
- `categorias` — lista de categorías ya existentes en el recetario, para usarlas como sugerencias (opcional)
- `onSubmit` — función que recibe los datos del formulario al guardar
- `onCancel` — función que se llama al pulsar Cancelar

## Estado y campos controlados

Todo el estado del formulario vive en tres variables locales:

- `form` — objeto con todos los campos de la receta (nombre, categoría, sabor, tiempo, ingredientes, pasos)
- `nuevoIngrediente` — campos del ingrediente que se está a punto de añadir
- `nuevoPaso` — texto del paso que se está a punto de añadir

Cada input tiene su `value` enlazado al estado y su `onChange` actualiza ese estado. Los ingredientes y pasos no forman parte del `form` directamente hasta que el usuario pulsa "Añadir".

## Validación

La validación pasa en dos sitios.

Al intentar añadir un ingrediente, se comprueba que todos sus campos están rellenos y que la cantidad es mayor que cero. Si algo falta, aparece un mensaje bajo el botón de añadir.

Al pulsar Guardar, se comprueba:
- que el nombre no está vacío
- que hay al menos un ingrediente
- que hay al menos un paso

Si alguna de estas comprobaciones falla, el formulario no se envía y aparecen mensajes de error bajo cada campo problemático. El error de nombre también marca el borde del input en rojo para que sea fácil de localizar.

Los errores desaparecen en cuanto se corrige el campo correspondiente.

## El campo de categoría

La categoría es texto libre. El usuario puede escribir lo que quiera. Para evitar que se creen categorías duplicadas por diferencias de capitalización ("Italiana" y "italiana"), el campo normaliza automáticamente el texto a minúsculas al salir del campo.

Además, si ya hay recetas con categorías asignadas, el campo muestra sugerencias mientras el usuario escribe (mediante un `<datalist>` nativo). El objetivo es que sea fácil ver que "italiana" ya existe y elegirla directamente en lugar de escribirla de nuevo con variaciones.

## Confirmación

No hay un mensaje de confirmación explícito. Cuando la receta se guarda correctamente, la página navega directamente al detalle de la receta creada o editada. La redirección hace de confirmación.
