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

## Nombres de columna: el caso que los backticks no cubren

Los template literals parametrizan **valores**, no identificadores. Cuando hace falta elegir
una columna en tiempo de ejecución, el driver obliga a `sql.unsafe()`, que interpola texto
tal cual. Ahí sí puede haber inyección.

Pasa en dos sitios, y en los dos lo que se interpola no viene nunca de la petición:

- `estadoService`, para elegir entre `plan`, `despensa`, `extras` y `pendientes`. El nombre
  se valida contra una lista literal en código antes de tocar el SQL.
- `recetasService`, para la lista de campos del `SELECT`, que es una constante.

La regla: `sql.unsafe()` solo con literales del código o con valores validados contra una
lista blanca. Nunca con algo que venga del cliente.

## Aislamiento entre hogares

El otro riesgo, que no es inyección pero se paga igual de caro, es servir los datos del
hogar equivocado. Dos reglas:

- **El hogar sale de la sesión, nunca de la petición.** `hogarDe(req)` lee
  `req.usuario.hogarId` y lanza si no hay sesión, en vez de caer en un hogar por defecto.
- **Toda lectura filtra por hogar en una sola consulta.** Las cinco de recetas se colapsaron
  en una precisamente para que no se pueda olvidar en un camino.

Hay tests que lo fijan: un usuario de otro hogar recibe `[]` al pedir la despensa, y nombrar
otro hogar por query string se ignora. Ver `server/tests/auth.test.js`.
