# Seguridad en base de datos

## Qué es SQL injection

SQL injection ocurre cuando un valor enviado por el usuario se concatena directamente en una query SQL. El motor de base de datos no distingue entre el SQL original y el valor introducido, así que lo ejecuta como si fuera código propio.

Ejemplo vulnerable:

```js
const query = "SELECT * FROM recetas WHERE nombre = '" + req.body.nombre + "'"
```

Si el usuario manda `'; DROP TABLE recetas; --`, la query resultante es:

```sql
SELECT * FROM recetas WHERE nombre = ''; DROP TABLE recetas; --'
```

Postgres ejecuta los dos statements. La tabla desaparece.

## Cómo lo evitamos

Con consultas parametrizadas. El driver envía la query y los valores por separado al motor. El valor siempre se trata como texto, nunca como SQL ejecutable.

En este proyecto usamos `@neondatabase/serverless` con template literals:

```js
const [receta] = await sql`
  INSERT INTO recetas (nombre, precio_por_porcion, porciones, category_id)
  VALUES (${nombre}, ${precio_por_porcion}, ${porciones}, ${category_id})
  RETURNING *
`
```

Los backticks hacen que el driver separe automáticamente el SQL de los valores. No es interpolación de strings normal. El motor recibe la query con placeholders y los valores aparte, sin posibilidad de mezclarlos.

## Por qué DATABASE_URL va en .env

La connection string contiene las credenciales maestras de la base de datos. Si se commitea al repositorio, cualquiera con acceso al repo tiene acceso total a la BD.

El archivo `.env` está en `.gitignore` y nunca se sube. En producción (Vercel) la variable se configura directamente en el panel de entorno, sin pasar por el código.
