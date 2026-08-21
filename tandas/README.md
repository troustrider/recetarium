# Tanda: 25 cenas de 15 minutos

`2026-08-cenas-15min.json` — 25 principales para dos, de 15 minutos y cinco pasos,
escritos contra el estándar de la skill `chef-recetarium`.

**Están validadas pero no insertadas.** La sesión donde se escribieron no tenía
acceso a la base de datos (sin `DATABASE_URL`, sin token de sesión y con el
conector de Neon pidiendo una aprobación que nadie podía dar), así que quedan
aquí listas para rematar en local. Este fichero se borra en cuanto se apliquen:
el lote vive en el scratchpad, y en el repo solo está porque el contenedor donde
se escribió es efímero.

## Lo que ya está hecho

```
node server/scripts/chef-recetas.mjs check tandas/2026-08-cenas-15min.json
→ 25 recetas, 0 errores, 0 avisos
```

- Cinco pasos por receta, que es el mínimo que acepta el validador para un
  principal, y ninguna pasa de 15 minutos de trabajo.
- Macros y `precioPorPorcion` calculados desde los ingredientes con
  `nutrientes.json` y `precios.json`, no a ojo. Ninguna baja de 35 g de proteína
  por ración (media: 47 g) y ninguna se sale de la banda de 0,80-4,50 €/ración.
- Todas usan ingredientes que ya tienen ficha en `server/src/lib/nutrientes.json`,
  así que la tanda no toca código: no hay fichas nuevas que añadir.
- Cada plato con su verdura propia o su `guarnicion` rellena, y con la procedencia
  y las desviaciones declaradas en `consejos`.

## ⚠️ Dedup: 11 de las 25 hay que sustituirlas antes de insertar

Esto es lo primero que hay que mirar, y no está resuelto.

El dedup se hizo contra `server/seed-recetas.mjs`, que trae **88 recetas con
nombre** y es la mejor foto del catálogo que hay dentro del repo (el `seed.sql`
solo tiene 20). No es la BD viva, que ronda las 280: **una receta que no aparece
ahí puede seguir existiendo**. Pero lo que sí aparece es evidencia fuerte, porque
ese seed se insertó.

### Choque directo — el mismo plato con otro nombre (8)

| # | Receta de la tanda | Ya en el seed |
|---|---|---|
| 1 | Ensalada César con pollo a la plancha | `Ensalada César de pollo` |
| 4 | Uitsmijter de jamón y queso | `Uitsmijter de jamón y queso` *(nombre idéntico)* |
| 8 | Pad krapow gai | `Pollo a la albahaca tailandés (pad krapow)` |
| 11 | Gong bao ji ding | `Pollo kung pao` |
| 14 | Piccata de pavo al limón | `Pollo piccata` *(mismo plato, otra ave)* |
| 22 | Sundubu jjigae | `Sundubu jjigae (estofado de tofu)` |
| 23 | Pollo lemonato de sartén | `Pollo griego al limón y orégano` |
| 25 | Ternera con brócoli y jengibre | `Ternera con brócoli` |

### Misma terna formato + proteína + base aromática (3)

No comparten nombre, comparten cena. Según la regla de dedup de la skill, cuentan
como duplicado:

| # | Receta de la tanda | Ya en el seed |
|---|---|---|
| 15 | Solomillo de cerdo a la mostaza | `Solomillo de cerdo con champiñones y arroz` + `Pollo a la mostaza con arroz` |
| 20 | Bami goreng | `Noodles salteados con pollo y verduras` |
| 21 | Arroz chaufa de pollo | `Arroz frito con huevo y pollo` |

### Dudosas — decidir con la BD viva delante (3)

| # | Receta de la tanda | Por qué duda |
|---|---|---|
| 9 | Tavuk sote | `Pollo turco especiado` es un nombre genérico que bien podría ser justo esto |
| 12 | Butadon | Sería el cuarto donburi: ya están `Gyudon`, `Katsudon` y `Oyakodon` |
| 24 | Yakisoba de cerdo y col | Roza `Noodles salteados con pollo y verduras`, aunque cambian carne y salsa |

### Las 11 sustitutas, ya elegidas pero **sin escribir**

Se quedaron diseñadas a este nivel: plato, cocina, de dónde sale la proteína y
por qué no choca. Ninguna está en las 88 del seed ni en las tablas del canon de
`canon-recetas.md`, que es donde viven los platos con más papeletas de estar ya
guardados. Cumplen el mismo encargo: ≤15 min, cinco pasos, ≥35 g de proteína por
ración, dos raciones, verdura propia o guarnición, y solo ingredientes con ficha
en `nutrientes.json`.

| Sustituta | Cocina | Proteína (para 2) | Nota |
|---|---|---|---|
| Bánh mì de cerdo a la sartén | vietnamita | 300 g lomo de cerdo + baguette | Cocina ausente. Sin paté ni nam pla: declararlo |
| Bò lúc lắc | vietnamita | 400 g filete de ternera en dados | Sobre lechuga y tomate, 5 min de sartén |
| Pad see ew de cerdo | tailandesa | 300 g lomo + 2 huevos + fideos de arroz planos | El canon usa gai lan; brócoli es el sustituto habitual |
| Yuxiang rousi | china | 350 g lomo de cerdo en tiras | Doubanjiang, vinagre y azúcar; segundo plato de Sichuan de la tanda |
| Saltimbocca de pavo | italiana | 400 g filetes de pavo + 60 g jamón serrano | El canónico es ternera; el de pavo existe en Italia |
| Nasu no miso itame | japonesa | 400 g carne picada de cerdo + miso | Berenjena como verdura propia |
| Ayam kecap | indonesia | 400 g contramuslos + ketjap manis | Sustituye al bami goreng manteniendo la cocina |
| Budae jjigae | coreana | salchicha + jamón cocido + tofu + fideos ramen | Plato documentado y muy distinto del resto |
| Keftedakia | griega | 400 g carne picada mixta + menta y orégano | Fritas y sin salsa: no es el de `Albóndigas en salsa` |
| Bitoque à portuguesa | portuguesa | 350 g filete de ternera + 2 huevos | Cocina ausente en las dos listas |
| Jjajangmyeon | coreana | 300 g lomo de cerdo + chunjang | Chunjang ya tiene ficha en `nutrientes.json` |

Con este cambio la tanda quedaría en: coreana 5, japonesa 4, turca 3, china 2,
italiana 2, indonesia 2, vietnamita 2, tailandesa 1, griega 1, mexicana 1,
portuguesa 1, mediooriente 1. Sin española ni holandesa, que es lo correcto:
son las dos que el seed ya cubre de sobra.

### Qué hacer en local

1. Bajar la lista real de nombres (comando de abajo) y **confirmar las 8 + 3**,
   porque el seed puede estar desfasado en las dos direcciones.
2. Resolver las 3 dudosas mirando la receta guardada, no solo el nombre:
   `SELECT nombre, pasos FROM recetas WHERE nombre ILIKE '%turco especiado%'`.
3. Escribir las sustitutas que hagan falta con la skill `chef-recetarium` en modo
   tanda (fase 5), quitar del JSON las que se caen y `check` hasta 0 errores.
4. `apply`, y después `audit` para comprobar que la BD entera sigue limpia.

```bash
cd server
node --input-type=module -e "
import 'dotenv/config'
import sql from './src/lib/db.js'
const filas = await sql\`SELECT nombre FROM recetas WHERE borrada_en IS NULL ORDER BY nombre\`
console.log(filas.map(f => f.nombre).join('\n'))
"
```

Compara por **formato + proteína + base aromática**, no solo por nombre. El
duplicado que se cuela no comparte nombre, comparte cena.

## Lo que falta y por qué

1. **La auditoría del bloque `principal`** que pide `tandas.md` en su fase 1
   (concentración por proteína y por formato, reparto de tiempos, defectos ya
   guardados). Sin BD no se pudo medir. La tanda se diseñó con las cuotas a
   ciegas pero con margen: 8 de 25 llevan pollo (32%), ninguna lleva udon, y las
   cocinas van repartidas en trece (coreana 4, turca 3, japonesa 3, china 3,
   italiana 2, mexicana 2, indonesia 2, y una de española, griega, holandesa,
   peruana, tailandesa y Oriente Medio).

2. **Siete ingredientes sin precio** en `src/data/precios.json`, que dejan la
   estimación de `precioPorPorcion` algo por debajo de la real: judías verdes,
   orecchiette, salchicha fresca de cerdo, pul biber, doubanjiang, chiles secos y
   pimienta de sichuan. Se añaden con precio visto en tienda:

   ```bash
   npm run precio -- "judías verdes" 2.99 kg Dirk "bolsa 400 g · 1,20 €" --nueva
   ```

   Después conviene volver a pasar el `check`, por si algún precio nuevo saca una
   receta de la banda.

## Cómo rematarlo

```bash
cd server
node scripts/chef-recetas.mjs check ../tandas/2026-08-cenas-15min.json   # 0 errores
node scripts/chef-recetas.mjs apply ../tandas/2026-08-cenas-15min.json   # inserta
node scripts/chef-recetas.mjs audit | tail -3                            # la BD entera sigue limpia
```

`apply` inserta (no traen `id`) y calcula `hierro`, `sin_gluten` y `micros` desde
los ingredientes, que es justo lo que un `INSERT` a mano no hace. Si algún plato
resulta ser un duplicado, se quita del array antes de aplicar: el fichero es una
lista y se puede recortar sin tocar nada más.

Verifica después y borra este directorio:

```sql
SELECT nombre, tiempo_preparacion, proteinas FROM recetas
WHERE borrada_en IS NULL AND tiempo_preparacion <= 15 AND tipo = 'principal'
ORDER BY nombre;
```

## Las 25

| # | Plato | Cocina | Min | Prot. g | kcal | €/ración | Guarnición |
|---|---|---|---|---|---|---|---|
| 1 | Ensalada César con pollo a la plancha | mexicana | 15 | 53 | 744 | 3,89 | — |
| 2 | Hummus con carne picada y piñones | mediooriente | 15 | 48 | 859 | 3,49 | Pan de pita y ensalada |
| 3 | Gado-gado exprés | indonesia | 15 | 46 | 756 | 2,76 | — |
| 4 | Uitsmijter de jamón y queso | holandesa | 12 | 38 | 578 | 2,07 | Tomate y pepinillos |
| 5 | Hellim ızgara con çoban salatası | turca | 15 | 38 | 789 | 4,32 | — |
| 6 | Jeyuk bokkeum | coreana | 15 | 46 | 479 | 2,38 | Arroz blanco |
| 7 | Buta no shogayaki | japonesa | 15 | 45 | 431 | 2,44 | Arroz blanco |
| 8 | Pad krapow gai | tailandesa | 15 | 50 | 630 | 3,48 | Arroz blanco |
| 9 | Tavuk sote | turca | 15 | 51 | 473 | 3,91 | Arroz pilav |
| 10 | Bistec a la mexicana | mexicana | 15 | 46 | 491 | 4,47 | Tortillas de maíz |
| 11 | Gong bao ji ding | china | 15 | 56 | 601 | 3,69 | Arroz blanco |
| 12 | Butadon | japonesa | 15 | 52 | 785 | 2,63 | Col rallada con sésamo |
| 13 | Dubu kimchi | coreana | 15 | 49 | 565 | 3,76 | Arroz blanco |
| 14 | Piccata de pavo al limón | italiana | 15 | 51 | 463 | 2,63 | Espinacas al ajo |
| 15 | Solomillo de cerdo a la mostaza | espanola | 15 | 46 | 548 | 3,00 | Judías verdes |
| 16 | Sucuklu yumurta | turca | 12 | 42 | 664 | 2,53 | Pan y tomate |
| 17 | Ma yi shang shu | china | 15 | 40 | 789 | 3,49 | — |
| 18 | Orecchiette con salchicha y brócoli | italiana | 15 | 41 | 905 | 1,41 | — |
| 19 | Kimchi bokkeumbap | coreana | 15 | 44 | 792 | 3,14 | — |
| 20 | Bami goreng | indonesia | 15 | 53 | 833 | 3,11 | — |
| 21 | Arroz chaufa de pollo | peruana | 15 | 56 | 800 | 3,94 | — |
| 22 | Sundubu jjigae | coreana | 15 | 42 | 452 | 4,30 | Arroz blanco |
| 23 | Pollo lemonato de sartén | griega | 15 | 50 | 474 | 3,34 | — |
| 24 | Yakisoba de cerdo y col | japonesa | 15 | 48 | 814 | 2,53 | — |
| 25 | Ternera con brócoli y jengibre | china | 15 | 45 | 493 | 4,07 | Arroz blanco |

Tres tramos por esfuerzo, que es el eje que pide `tandas.md` cuando lo que se
busca es facilidad: **montaje y poco fuego** (1-5), **una sola sartén** (6-17) y
**sartén con un hervido en paralelo** (18-25).

Dos platos declaran su desviación de tiempo en `consejos` porque su versión
canónica no cabe en quince minutos: el *Pollo lemonato* (el griego va al horno
una hora larga) y el *Kimchi bokkeumbap* y el *Arroz chaufa*, que necesitan arroz
cocido del día anterior y lo dicen en el primer paso.
