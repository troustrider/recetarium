# Recetarium

## ¿Qué problema resuelve?

Alguien que cocina en casa a diario tiene recetas repartidas por todos lados: notas del móvil, papeles en la cocina, links guardados, mensajes... Recetarium es donde tenerlas todas juntas: guardar, organizar y encontrar tus recetas, y planificar la compra de la semana sin comprar de más ni de menos.

## Usuario objetivo

Personas que cocinan habitualmente en casa y quieren tener sus recetas organizadas y la compra controlada.

## Funcionalidades principales

- Ver un catálogo de recetas
- Crear, editar y borrar recetas (nombre, ingredientes con cantidad y unidad, pasos, categoría, sabor, tiempo de preparación)
- Ver el detalle de una receta
- Buscar y filtrar por categoría y sabor
- Guardar recetas como favoritas
- Lista de la compra: seleccionar recetas y generar una lista que fusiona ingredientes y suma cantidades
- Planificador semanal: asignar recetas a días y ajustar raciones
- Despensa: registrar qué ingredientes tienes en casa

## Posibles mejoras futuras

Cosas que me parecen interesantes pero que quedaron fuera del alcance de este proyecto:

- **Filtro por tiempo de preparación** — ya está el campo en el modelo, solo faltaría el filtro en la UI
- **Ajustar comensales en el detalle** — que al cambiar el número de personas se recalculen las cantidades de los ingredientes
- **Despensa integrada en la lista de la compra** — que la lista ya descuente lo que tienes en casa sin tener que mirarlo a mano
- **Base de datos real** — ahora mismo los datos están en un JSON y no persisten en producción; migrar a MongoDB o similar resolvería eso
