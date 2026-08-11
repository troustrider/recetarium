# Arquitectura de datos

## Tablas

### categories
Define los tipos de recetas. Cada categoría tiene un ID único (UUID), un nombre obligatorio y una descripción opcional.

### recetas
Almacena las recetas. Cada una pertenece a una categoría a través de `category_id`. La
columna `hogar_id` decide su alcance: **nula es catálogo común**, visible para todos; con un
hogar, receta privada de ese hogar. El borrado es lógico (`borrada_en`), para que restaurar
devuelva la receta con su mismo id y el plan que la referenciaba siga valiendo.

### hogares
Un hogar es el dueño del estado: una o varias personas que comparten despensa, plan y lista.

### app_estado
Una fila por hogar, con el plan semanal, la despensa, los extras de la lista y las compradas
pendientes de planificar, todo en `jsonb`.

### miembros
Qué usuario pertenece a qué hogar, y con qué rol (`admin` o `usuario`). El usuario vive en el
esquema `neon_auth`, que gestiona Neon Auth.

### invitados
Lista blanca de acceso. Sin fila aquí no se entra. `hogar_id` nulo significa "créale un hogar
propio en su primer inicio de sesión"; relleno, "métele en ese hogar".

### favoritas
Qué recetas ha marcado cada hogar. Antes era una columna de `recetas`, así que marcar una
favorita se la marcaba a todo el mundo.

## Decisiones de diseño

**UUID como clave primaria**
Se usa `gen_random_uuid()` en vez de enteros autoincrementales. Con enteros, cualquiera puede adivinar el siguiente ID y hacer scraping o enumeración de recursos. Con varios servidores, los enteros también colisionarían al sincronizar datos. UUID elimina ambos problemas.

**ON DELETE RESTRICT en la FK**
Si una categoría tiene recetas asociadas, Postgres rechaza el borrado. Se eligió `RESTRICT` sobre `CASCADE` para evitar borrados en cadena silenciosos: perder todas las recetas de una categoría por borrar la categoría sería un error difícil de detectar y recuperar.

**Sin clave ajena contra `neon_auth`**
`miembros.usuario_id` apunta a un usuario de `neon_auth.user`, pero sin `FOREIGN KEY`. Es el
esquema de un servicio gestionado y Neon puede recrear sus tablas en cualquier actualización
suya, lo que dejaría la nuestra bloqueada o rota. El `JOIN` funciona igual, que es lo que se
necesita. Contra `hogares`, que es nuestra, sí hay FK con `ON DELETE CASCADE`.

## Relación entre tablas

```
categories (1) ──── (N) recetas
                        │
neon_auth.user (N) ── miembros ── (1) hogares (1) ── (1) app_estado
                                        │  │
                                 invitados  favoritas ── (N) recetas
```

Una categoría puede tener muchas recetas. Una receta pertenece exactamente a una categoría, y
o es del catálogo común o de un hogar. Un hogar tiene una fila de estado y varios miembros.
