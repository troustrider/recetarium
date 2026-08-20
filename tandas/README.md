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

## Lo que falta y por qué

1. **Dedup contra la base de datos real.** Es lo único serio que queda. El
   `seed.sql` del repo tiene 20 recetas y la BD viva ronda las 280, así que no se
   ha podido comparar contra la lista de nombres completa. Antes de aplicar:

   ```bash
   cd server
   node --input-type=module -e "
   import 'dotenv/config'
   import sql from './src/lib/db.js'
   const filas = await sql\`SELECT nombre FROM recetas WHERE borrada_en IS NULL ORDER BY nombre\`
   console.log(filas.map(f => f.nombre).join('\n'))
   "
   ```

   Compara por **formato + proteína + base aromática**, no solo por nombre. Los
   candidatos más probables a chocar, por ser platos muy vistos, son *Bami
   goreng*, *Yakisoba de cerdo y col*, *Ternera con brócoli y jengibre* y
   *Ensalada César con pollo a la plancha*. Se han evitado a propósito los platos
   que están en las tablas del canon (gyudon, oyakodon, teriyaki, mapo tofu,
   bulgogi, tteokbokki, larb, nasi goreng, lomo saltado, tinga, shakshuka,
   menemen), porque son los que más papeletas tienen de estar ya guardados.

2. **La auditoría del bloque `principal`** que pide `tandas.md` en su fase 1
   (concentración por proteína y por formato, reparto de tiempos, defectos ya
   guardados). Sin BD no se pudo medir. La tanda se diseñó con las cuotas a
   ciegas pero con margen: 8 de 25 llevan pollo (32%), ninguna lleva udon, y las
   cocinas van repartidas en trece (coreana 4, turca 3, japonesa 3, china 3,
   italiana 2, mexicana 2, indonesia 2, y una de española, griega, holandesa,
   peruana, tailandesa y Oriente Medio).

3. **Siete ingredientes sin precio** en `src/data/precios.json`, que dejan la
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
