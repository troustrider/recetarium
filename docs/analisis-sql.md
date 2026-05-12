# Análisis SQL

## INNER JOIN vs LEFT JOIN

### INNER JOIN
Devuelve solo las filas que tienen coincidencia en ambas tablas. Si una categoría no tiene recetas, no aparece en el resultado.

Cuándo usarlo: cuando tienes certeza de que todos los registros de la tabla principal tienen datos relacionados en la otra tabla. Por ejemplo, listar recetas con su categoría. Toda receta tiene una categoría obligatoria (NOT NULL).

```sql
SELECT r.nombre, r.precio_por_porcion, c.name AS categoria
FROM recetas r
INNER JOIN categories c ON r.category_id = c.id
ORDER BY c.name;
```

### LEFT JOIN
Devuelve todas las filas de la tabla izquierda, aunque no tengan coincidencia en la derecha. Las columnas sin coincidencia aparecen como NULL.

Cuándo usarlo: cuando no puedes asumir que todos los registros tienen datos relacionados. Una categoría recién creada sin recetas todavía aparecería con `total_recetas = 0`. Con INNER JOIN sería invisible, un bug silencioso.

```sql
SELECT c.name, COUNT(r.id) AS total_recetas
FROM categories c
LEFT JOIN recetas r ON c.id = r.category_id
GROUP BY c.name
ORDER BY total_recetas DESC;
```

## COUNT(r.id) vs COUNT(*)

`COUNT(r.id)` cuenta solo las filas donde `r.id` no es NULL, es decir, categorías con recetas reales.
`COUNT(*)` contaría también las filas NULL que produce el LEFT JOIN en categorías vacías, dando 1 en vez de 0.
