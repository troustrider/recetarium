# Arquitectura de datos

## Tablas

### categories
Define los tipos de recetas. Cada categoría tiene un ID único (UUID), un nombre obligatorio y una descripción opcional.

### recetas
Almacena las recetas del sistema. Cada receta pertenece a una categoría a través de `category_id`, que referencia el `id` de `categories`.

## Decisiones de diseño

**UUID como clave primaria**
Se usa `gen_random_uuid()` en vez de enteros autoincrementales. Con enteros, cualquiera puede adivinar el siguiente ID y hacer scraping o enumeración de recursos. Con varios servidores, los enteros también colisionarían al sincronizar datos. UUID elimina ambos problemas.

**ON DELETE RESTRICT en la FK**
Si una categoría tiene recetas asociadas, Postgres rechaza el borrado. Se eligió `RESTRICT` sobre `CASCADE` para evitar borrados en cadena silenciosos: perder todas las recetas de una categoría por borrar la categoría sería un error difícil de detectar y recuperar.

## Relación entre tablas

```
categories (1) ──── (N) recetas
```

Una categoría puede tener muchas recetas. Una receta pertenece exactamente a una categoría.
