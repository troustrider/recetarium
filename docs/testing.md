# Testing

## Cómo lo hice

Fui probando cada cosa en el navegador según la iba desarrollando, con el frontend y el backend corriendo en local. No hay tests automáticos, todo fue manual y a ojo.

## Qué probé

**CRUD de recetas.** Crear, editar y borrar funciona. El formulario no deja guardar si falta el nombre, algún ingrediente o algún paso. La categoría se guarda siempre en minúsculas y sugiere las que ya existen. Al guardar, va directo al detalle de la receta. Todo persiste al recargar la página.

**Catálogo y filtros.** Los filtros de categoría se generan solos a partir de las recetas que hay. El de sabor cubre los cinco tipos. Se pueden usar los dos filtros a la vez. El corazón de favorita responde bien desde la tarjeta.

**Favoritas.** Las tarjetas se ven igual que en el catálogo, con imágenes incluidas. Había un bug donde salían gradientes de color en lugar de las imágenes porque la página usaba sus propias tarjetas en vez del componente que ya existía. Se arregló.

**Planificador.** Se pueden poner varias recetas el mismo día. Los botones +/− de raciones funcionan por receta (entre 1 y 4). Se puede arrastrar una receta de un día a otro. Al añadir una receta al planificador, aparece sola en la lista de la compra. Si la misma receta está en varios días, las raciones se suman.

**Despensa.** Se añaden ingredientes con su categoría. Se agrupan por tipo. Haciendo clic en un ingrediente cambia entre "lleno" y "poco". Hay un botón para importar todo lo que hay en la lista de la compra de golpe. Los filtros por estado funcionan. Se guarda en el navegador y no se pierde al recargar.

**Lista de la compra.** Los ingredientes de distintas recetas se juntan correctamente, sumando cantidades. Las raciones multiplican bien.

**Modo oscuro.** El toggle funciona y recuerda la preferencia. Si no hay preferencia guardada, usa la del sistema. El cambio entre modos tiene una transición suave.

**Estados de carga y error.** Se probó cortando el servidor para ver qué pasa. Aparece el mensaje de error y el botón de reintentar funciona al volver a levantarlo.

## Responsive

Probado en móvil, tablet y escritorio. El catálogo pasa de una columna a dos. La navegación colapsa en móvil. El resto se ve bien en todos los tamaños.

## Bugs encontrados

Dos cosas que se corrigieron durante el proceso:

- **Favoritas sin imágenes.** La página tenía sus propias tarjetas con gradientes de color en lugar de usar el componente `RecetaCard`. Se reemplazó y ya muestra las imágenes.
- **Raciones que se cortaban.** Al sincronizar el planificador con la lista de la compra, las raciones se limitaban a 4 aunque la suma de varios días fuera mayor. Se quitó ese límite.
