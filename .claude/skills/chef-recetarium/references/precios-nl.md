# Precios: dónde están y cómo se corrigen

**Los números ya no viven en este fichero.** Están en `src/data/precios.json`, dentro del repo de Recetarium, y son fuente única: la app calcula con ellos el coste de la lista de la compra y tú los usas para estimar `precioPorPorcion`. Si están en dos sitios, se separan.

Este fichero es el método: de dónde salen, cómo se corrigen y cómo se comprueba que siguen valiendo.

## Cadenas de referencia

**Dirk van den Broek y Lidl**, que es donde compra Karim (ver `compra-nl.md`). Nivel de precios: marca blanca. AH, Jumbo y Picnic son otro nivel y no sirven de referencia aquí, aunque esta tabla se calibró originalmente con ellos.

## Qué hay en cada entrada

```json
{
  "nombre": "pechuga de pollo",
  "euros": 8, "unidad": "kg",
  "fuente": "Dirk", "formato": "bandeja 500 g · 4,00 €",
  "revisado": "2026-08",
  "gramosPorUd": 150
}
```

`fuente` es lo que separa un dato de una suposición: `estimado` significa que nadie lo ha visto en tienda, y un nombre de cadena significa precio real. `formato` guarda el envase para poder repetir la comprobación. `gramosPorUd` solo en lo que se vende al peso pero las recetas cuentan por piezas ("2 contramuslos").

Unidades permitidas: `g`, `kg`, `ml`, `cl`, `l`, `ud`. Nada más: el motor solo sabe convertir esas.

## Cómo corregir un precio

Siempre por el script, nunca editando el JSON a mano:

```
npm run precio -- "pechuga de pollo" 9.49 kg Dirk "bandeja 500 g · 4,75 €"
```

Rechaza nombres que no existen y sugiere el parecido, rechaza unidades que el motor no entiende, avisa si el precio cambia más de la mitad, y pone la fecha solo. Para un ingrediente que aún no está, añade `--nueva`.

Para ver qué queda sin contrastar:

```
npm run precio -- --listar-sin-contrastar
```

## Cómo se comprueba que la tabla vale

```
npm run test:server
```

Da tres cosas: cobertura sobre las apariciones reales de ingrediente del recetario, desviación contra los `precioPorPorcion` que ya curaste (son cientos de puntos de datos independientes, y si la tabla se tuerce se nota ahí), y el ranking de qué contrastar primero por euros que mueve.

`npm run test:web` valida la forma del fichero: campos obligatorios, unidades válidas, nombres en minúscula, que ninguna entrada quede tapada por otra y que no haya precios absurdos.

## Estimar precioPorPorcion de una receta nueva

Prorratea cada ingrediente con la tabla, suma y divide entre porciones. Redondeo a un decimal.

Sanity check: el recetario se mueve entre **0,80 y 4,50 €/ración**. Fuera de ese rango, revisa antes de darlo por bueno: ¿ingrediente caro sustituible?, ¿porciones mal contadas?

Regla rápida para lo que no merece prorrateo fino: especias, sal y aceite en cantidades de cucharada suman un fijo de 0,20-0,40 € por receta. La sal y la pimienta van "al gusto" y el motor las cuenta a cero, porque no se compran cada semana.

## Ojo con las raciones

Las recetas están escritas para las porciones que declaran, y hoy todas son para 2. `raciones` cuenta **personas**, no veces que se cocina: 2 raciones de un plato para 2 es hacerlo una vez. Si escribes una receta para otro número de comensales, `porciones` tiene que decirlo, o las cantidades de la lista de la compra saldrán mal.
