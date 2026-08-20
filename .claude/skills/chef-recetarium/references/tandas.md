# Tandas: lotes de recetas nuevas

Modo para "mete 25 desayunos", "una tanda de postres", "el recetario está corto de X". Se distingue del modo Alta en que allí Karim trae una receta; aquí trae **un hueco**, y el trabajo empieza por medir el hueco, no por cocinar.

La regla que gobierna el modo: **no se diseña una tanda sin auditar antes el bloque que va a crecer.** Una tanda diseñada a ojo repite justo lo que ya sobra. Así es como el recetario acabó con 34 recetas de udon sobre 279, y con el 79% de los desayunos llevando huevo sin que nadie lo hubiera decidido.

Seis fases. Las tres primeras van en un solo turno y terminan con Karim aprobando un diseño, no una receta.

---

## Fase 1 — Auditar

Cuatro medidas, y las cuatro se le enseñan **con números** en la respuesta. La auditoría no es trabajo preparatorio privado: es media entrega, y casi siempre encuentra algo que él no sabía.

### 1.1 Reparto por tipo — cuánto pesa el bloque hoy

```sql
SELECT tipo, count(*) AS n, round(100.0*count(*)/sum(count(*)) OVER (),1) AS pct
FROM recetas WHERE borrada_en IS NULL GROUP BY tipo ORDER BY n DESC;
```

Da el punto de partida y el objetivo. Un bloque que va segundo por una receta no va segundo: va empatado, y eso cambia cuántas hacen falta.

### 1.2 Concentración dentro del bloque — la medida que encuentra el problema real

La que más rinde. Cuenta el eje dominante **dentro** del bloque que crece, no sobre toda la BD:

```sql
SELECT count(*) AS total,
       count(*) FILTER (WHERE ingredientes::text ILIKE '%huevo%') AS eje_1,
       count(*) FILTER (WHERE ingredientes::text ILIKE '%kwark%') AS eje_2
FROM recetas WHERE borrada_en IS NULL AND tipo = 'desayuno';   -- cambia el tipo y los FILTER
```

**Qué contar en cada bloque.** Esto es lo que cambia de un tipo a otro; el resto de la fase no cambia.

| Bloque | Ejes que se saturan | Señal de alarma |
|---|---|---|
| `principal` | Proteína (pollo, ternera, cerdo, tofu) y formato (udon, arroz, pasta, guiso) | Pollo >45% del bloque; un formato >10% del recetario |
| `desayuno` | Huevo, lácteo proteico, y el formato "bowl/tortitas" genérico | Huevo >60%; formato gym >20% |
| `postre` | Base (chocolate, lácteo, fruta, masa) y técnica (nevera, horno, sartén) | Una base o una técnica >40% |
| `entrante` | Frío vs caliente, y base (legumbre, verdura, pan, queso) | Frío >70% (el recetario se queda sin entrantes de invierno) |

Umbrales de referencia en `criterio-chef.md`. Si ninguno se dispara, dilo: una tanda también puede ser sólo crecimiento, sin corrección.

### 1.3 Distribución de esfuerzo — dónde se rompe la promesa del bloque

```sql
SELECT count(*) AS total,
       count(*) FILTER (WHERE tiempo_preparacion <= 15) AS rapidas,
       round(avg(tiempo_preparacion)) AS media
FROM recetas WHERE borrada_en IS NULL AND tipo = 'desayuno';   -- ajusta el corte al bloque
```

El corte útil no es el mismo en todos lados:

| Bloque | Corte que importa | Por qué |
|---|---|---|
| `principal` | ≤30 min, y cuántos pasan de 60 | Entre semana hay dos fuegos y sin ayudante. Los de 2 h son plan de finde y `canon-recetas.md` obliga a decirlo |
| `desayuno` | ≤10 min | Por la mañana no hay ni tiempo ni ganas |
| `postre` | Cuántos piden horno o reposo largo | Un bloque entero de nevera deja el recetario sin postre improvisable, y al revés |
| `entrante` | ≤15 min | Un entrante que tarda como el principal no se hace nunca |

### 1.4 Defectos ya guardados

Dos capas. Primero la barrida completa, que ya está implementada y cubre todas las puertas automatizables:

```bash
node scripts/chef-recetas.mjs audit
```

Escupe ERROR y aviso receta a receta con su `categoria/tipo`, así que se filtra a ojo por el bloque. Y encima, la puerta propia del bloque, que **no es la misma en todos**:

| Bloque | Puerta numérica | Consulta |
|---|---|---|
| `principal` | Suelo de 20 g de proteína, y comida completa (verdura propia o `guarnicion` rellena) | `proteinas < 20`, y `guarnicion IS NULL` sobre platos que la piden |
| `desayuno` | Suelo de 15 g de proteína | `proteinas < 15` |
| `postre` / `entrante` | **Ninguna.** No inventes una | Sólo `audit` |

```sql
SELECT nombre, proteinas FROM recetas
WHERE borrada_en IS NULL AND tipo = 'principal' AND proteinas < 20 ORDER BY proteinas;
```

La consulta usa el suelo y no el objetivo a propósito: lo que sale de ahí es deuda de verdad. Lo que queda entre el suelo y el objetivo (35 g con carne o pescado, 25 sin ellos) lo saca `audit`, que sí sabe si el plato es vegetal y si declara su palanca; a ojo, desde SQL, no se distingue una cena floja de un guiso de lentejas honrado. Ver el gate completo en `criterio-chef.md`.

Que un bloque no tenga puerta de proteína no lo exime: en postres y entrantes el defecto típico es de pasos y de procedencia, y eso lo caza `audit`. No se arregla nada ahora: esto se convierte en la fase 6.

### 1.5 Dedup

Lista completa de nombres de **todos** los tipos, no solo del bloque. El duplicado que se cuela está guardado como `principal` (Menemen y Chilaquiles estaban ahí cuando se buscaban desayunos). Protocolo en `SKILL.md` § Deduplicación.

```sql
SELECT string_agg(nombre, ' | ' ORDER BY nombre) FROM recetas WHERE borrada_en IS NULL;
```

---

## Fase 2 — Cerrar el encargo

Tres decisiones que **no se pueden derivar de la BD** y que cambian el contenido de la tanda. Van por `AskUserQuestion`, con recomendación en la primera opción:

1. **Volumen y objetivo.** Cuánto tiene que pesar el bloque al terminar, traducido a un número concreto de recetas y al porcentaje resultante.
2. **Qué se hace con la concentración encontrada.** Cuota explícita para lo sobrerrepresentado (p. ej. "máx 20% con huevo"), corrección total, o sin restricción.
3. **Qué se hace con los defectos de 1.4.** Antes de la tanda, después, o deuda anotada.

Todo lo demás se decide y se dice, no se pregunta. **Nunca preguntes lo que puedes medir.**

---

## Fase 3 — Diseñar la tanda como estructura

Una tanda no es una lista de platos buenos: es un reparto. Se diseña sobre un **eje estructural** elegido según lo que pidió Karim, y se parte en 3 tramos por ese eje.

| Si pidió | Eje | Tramos típicos |
|---|---|---|
| Facilidad, prisa | Esfuerzo | montaje sin fuego / un cacharro / sartén u horno |
| Variedad | Formato | cuchara / plato montado / masa o pan |
| Barato | €/ración | <1,20 / 1,20-2 / 2-3 |
| Una cocina | Momento | diario / fin de semana / fiesta |

Sobre ese esqueleto, cuatro condiciones:

- **Antes de listar platos, valida la familia.** Este es el paso que más caro sale saltarse. Elige la familia de la que van a salir (montaje en frío, cuchara, masa rellena, salteado…) y comprueba **sobre dos o tres ejemplos** que esa familia puede cumplir la puerta del bloque. Si no puede, no se rescata plato a plato: se cambia de familia. Una tanda de desayunos se diseñó sobre montajes de pan, queso y embutido y se cayó entera en verificación, porque esa familia es meze o merienda en su cocina de origen y no carga la proteína que pide el bloque.
- **La cuota de la fase 2 se cumple contando**, no aproximando. Si el acuerdo fue máx 20% con huevo en 25 recetas, son 5 exactas y se marcan en la tabla.
- **Diseña con margen.** La fase 5 es una criba, no un trámite: espera perder platos. En la tanda de desayunos sobrevivieron 18 de 37 candidatos. Lista un 30-40% más de platos que el objetivo, o acepta desde el principio que el número final será menor y dilo.
- **Cada receta declara su nivel de procedencia antes de escribirse** (A/B/C de `canon-recetas.md`) y **de dónde sale su proteína**. Si no sabes de dónde va a salir, la receta no está diseñada: está deseada.
- **Cocinas ausentes primero.** Una tanda es la ocasión barata de meter las que faltan. Míralo por `categoria` sobre el bloque entero.
- **Nada de fusión de relleno.** Si un hueco no se llena con un plato documentado, se deja el hueco y se dice, en vez de inventar un nivel C para cuadrar el número.

Y la condición propia del bloque, que hay que poner en el diseño y no descubrir al escribir:

| Bloque | Condición que se diseña, no se improvisa |
|---|---|
| `principal` | Cada plato con su verdura o su `guarnicion` desde la tabla de diseño. Y **cuota de tiempo**: si toda la tanda son guisos de 90 min, el recetario gana platos que no se cocinan entre semana |
| `desayuno` | El reparto dulce/salado, además del eje de esfuerzo. Un bloque todo salado no se desayuna |
| `postre` | Mezcla de nevera y horno, y al menos uno improvisable con despensa |
| `entrante` | Mezcla de frío y caliente, y decidir si son picoteo o plato que se sienta a la mesa |

### Lo que se entrega al final de la fase 3

Tabla por tramos: `# | plato | cocina | de dónde sale la proteína | nota`, con las marcas de cuota visibles. Y debajo, el bloque **"los números que mueve esto"**: antes y después de las cuatro medidas de la fase 1. Ese bloque es lo que convierte la tanda en una decisión y no en una lista de sugerencias.

Karim aprueba o veta aquí, plato a plato. No se escribe una sola receta antes.

---

## Fase 4 — Escanear fichas nutricionales

Antes de escribir nada, comprueba qué ingredientes nuevos de la tanda no tienen ficha en `server/src/lib/nutrientes.json`. Es lo único de la tanda que toca código del repo, así que conviene saberlo pronto (y es lo que hay que mirar si hay otra sesión trabajando en paralelo).

```powershell
$j = Get-Content "server\src\lib\nutrientes.json" -Raw | ConvertFrom-Json
$keys = $j.ingredientes.PSObject.Properties.Name
$buscar = @('tempeh','labneh','bagel')   # ingredientes nuevos de la tanda
foreach ($b in $buscar) { $m = $keys | Where-Object { $_ -like "*$b*" }
  if ($m) { "OK  $b -> $($m -join ', ')" } else { "FALTA  $b" } }
```

Ojo: el fichero tiene la forma `{ _doc, unidades, ignorar, ingredientes }`. Las fichas cuelgan de `ingredientes`, no de la raíz. Formato de cada ficha en `nutricion-ficha.md`.

`check` sobre el lote también lista los ingredientes sin ficha, y `node scripts/chef-recetas.mjs nutricion --dry` los lista para toda la BD. Pero eso llega tarde: si te enteras en la fase 5 de que faltan quince fichas, ya has escrito el lote entero con macros que no puedes verificar. Por eso el escaneo va aquí.

---

## Fase 5 — Implementar

1. **Verificar procedencia.** Todo lo que sea nivel B pasa por el protocolo de `canon-recetas.md` **antes** de escribirse. En una tanda son muchos platos: delega la búsqueda a subagentes baratos (`Explore`, o `Agent` con `model: haiku`) por lotes geográficos, y pide de vuelta ratios, no negociables y tiempos — no el volcado de las páginas.
2. **Rellenar las fichas** que faltaban de la fase 4.
3. **Escribir el lote** en un único JSON contra `contrato-receta.md`, **en el scratchpad**, no en el repo.
4. **`node scripts/chef-recetas.mjs check lote.json`** hasta 0 errores. Sin esto no se enseña nada.
5. **Enseñar**: tabla resumen del lote + 2-3 recetas completas de muestra. Esperar el OK.
6. **`apply`**, y verificar con SELECT que están las que tienen que estar.

Si un plato no sobrevive a la verificación del paso 1, **se cae y se dice**. No se rellena el hueco a ojo para mantener el número redondo.

### Qué se le pregunta al verificador

La diferencia entre una ronda útil y una que confirma lo que ya creías está en las preguntas. Además del protocolo de `canon-recetas.md`, mete en cada lote las dos o tres dudas concretas que **podrían tumbar el plato**, formuladas para que la respuesta sea un no si toca: si la marinada obligatoria cabe en una mañana, si la masa comprada es una vía aceptada o una corrupción, si el sustituto de un T3 es equivalente de verdad, si el ingrediente clave existe en Dirk. Y pide un veredicto explícito por plato —OK, DUDA con qué falta contrastar, o PROBLEMA con por qué—, no un resumen.

Dos cosas que la experiencia dice que hay que vigilar: los subagentes a veces **delegan en vez de investigar** y vuelven anunciando trabajo en curso, así que exige que la búsqueda la haga el propio agente; y una fuente que no se pudo contrastar es un dato que no tienes, no un dato flojo. Un ratio sin verificar no se escribe en una receta.

### Si el plato se come a otra hora en su país

No es motivo para descartarlo. La skill exige que el plato sea real y esté bien hecho, no que se coma a una hora concreta: `tipo` en la app significa cuándo lo va a comer Karim. Un meze griego o un Brotzeit bávaro pueden entrar como desayuno **declarando en `consejos` cuándo se comen allí**. Lo que no se relaja nunca es el suelo de proteína del bloque, que es el que de verdad decide si la receta sirve para ese hueco.

---

## Fase 6 — Cerrar la deuda que abrió la auditoría

Los defectos de 1.4 se arreglan después de la tanda, en modo Revisión, **de uno en uno y con aprobación individual**. Una tanda que añade 25 recetas limpias y deja 8 rotas detrás no ha mejorado el recetario, lo ha diluido.

---

## Reglas del modo

- **Rama de git propia** para la tanda, desde el principio. Una tanda toca la BD compartida y puede tocar `nutrientes.json`; conviene que sea aislable y revisable.
- **El JSON del lote vive en el scratchpad.** Lo que se commitea es `nutrientes.json`, si acaso.
- **Nada de `apply` sin OK explícito** sobre el lote que se acaba de enseñar.
- **Si otra sesión está trabajando en el repo**, comprueba en la fase 4 si toca `nutrientes.json`. Si no lo toca, no hay solape y se sigue. Si lo toca, se para la tanda ahí y se avisa.
