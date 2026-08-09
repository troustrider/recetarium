# Recetarium: plan multiusuario + autenticación

> Documento de trabajo para ejecutar desde **Claude Code** en el repo `recetarium/`.
> Ejecutar las fases **en orden**. Cada fase es un commit desplegable y reversible.
>
> **Este fichero es la fuente de verdad del plan.** Léelo entero al empezar una sesión
> de implementación y no re-explores el repo: los ficheros que hay que tocar están
> listados en cada fase.

---

## Objetivo

Pasar de "app de dos personas con contraseña compartida" a "app de amigos y familia con
cuentas reales", sin perder el estado compartido que Karim y Cloe ya usan.

- Catálogo de recetas **común** para todos, editable solo por admins.
- Cada hogar puede además crear sus **recetas privadas**.
- Despensa, planificador semanal, pendientes y extras: **por hogar**.
- Alta **solo por lista blanca de correos**.

---

## Estado actual (agosto 2026)

**Stack.** React 19 + TS + Vite (front) · Express 5 + Neon Postgres (back, driver
`@neondatabase/serverless` con templates SQL, no ORM) · Deploy en Vercel, el backend
entero corre como una sola función serverless (`api/index.js`, ver `vercel.json`).

**Lo que hoy hace de auth.** No hay autenticación, hay una contraseña de puerta:

- `server/src/lib/auth.js` → `requireKey` compara la cabecera `x-app-key` con la
  variable de entorno `APP_KEY`. Si `APP_KEY` no está definida, **deja pasar**.
- `src/api/auth.ts` → `authedFetch` guarda la passphrase en `localStorage` y la
  reintenta con `window.prompt` al recibir un 401.
- `requireKey` está aplicado **solo a escrituras** (13 rutas). **Todos los `GET` son
  públicos**: cualquiera con la URL ve el plan y la despensa.

**El cuello de botella real.** `app_estado` es una **fila única**, forzada por
`CONSTRAINT app_estado_single_row CHECK (id = 1)` (`sql/schema.sql:42`). Plan, despensa,
extras y pendientes son cuatro columnas JSONB de un único registro global. Ahí está la
mayor parte del trabajo, no en el login.

**Lo que juega a favor.** El código ya está embudado en dos puntos:

- Front: toda escritura pasa por `authedFetch` (`src/api/auth.ts:20`).
- Back: toda escritura pasa por `requireKey`.

**Datos vivos.** La BD de producción tiene ~268 recetas. `sql/seed.sql` solo tiene 20:
**nunca reseedear**. Las migraciones van como fichero nuevo en `sql/` con el patrón
`AAAA-MM-descripcion.sql` (ver `sql/2026-08-guarnicion.sql`).

---

## Decisiones cerradas

| Decisión | Elegido |
|---|---|
| Proveedor de auth | **Neon Auth (Managed Better Auth)** |
| Unidad de propiedad del estado | **Hogar** (grupo de 1..N usuarios) |
| Catálogo | **Común editable por admin + recetas privadas por hogar** |
| Alta de usuarios | **Lista blanca de correos** |
| Acceso sin sesión | **Ninguno.** Sin login solo se ve la landing |
| Landing | **Opción B, "editorial con calidez"**. La C (muestra visual del producto) queda para más adelante |

### Por qué hogar y no usuario

Karim y Cloe comparten estado hoy. Si el dueño pasa a ser el usuario, se separan y se
rompe su flujo. Con hogares: ellos dos son el hogar 1, cada amigo entra con su hogar de
uno, y compartir en pareja funciona sin cambios. Cuesta lo mismo implementarlo así.

### Qué es Neon Auth, en concreto

Servicio gestionado construido sobre Better Auth. Verificado en la documentación de Neon:

- Guarda usuarios, sesiones y configuración OAuth en el esquema **`neon_auth` de tu
  propia base de datos**. Consultable con SQL, compatible con RLS.
- **La auth se ramifica con la BD**: cada rama Neon tiene usuarios y sesiones aislados.
  La rama `recetarium-test` tendrá sus propias cuentas, sin tocar producción.
- SPA React: `createAuthClient(import.meta.env.VITE_NEON_AUTH_URL, { adapter: BetterAuthReactAdapter() })`
  desde `@neondatabase/neon-js/auth`, hook `useSession()`, componentes `<AuthView>`,
  `<UserButton>`, `<SignedIn>`, `<SignedOut>` desde `@neondatabase/auth-ui`.
- Lado servidor: `createNeonAuth()` expone `.handler()`, `.middleware()` y `.getSession()`.

La API exacta del lado Express se confirma **al empezar la fase 2**, no antes.

---

## Las reglas de seguridad que no se negocian

1. **El `hogarId` sale siempre de la sesión del servidor, nunca del cliente.** Si un
   endpoint acepta `?hogar=7` del front, cualquiera cambia el número y lee la despensa
   ajena. Es un IDOR y es el fallo número uno en apps caseras multiusuario.
2. **Sesión en cookie `httpOnly; Secure; SameSite`**, no token en `localStorage`. Lo
   segundo lo lee cualquier script inyectado.
3. **Los `GET` también se cierran.** Hoy son públicos. Un endpoint de lectura sin sesión
   filtra exactamente los mismos datos que uno de escritura.
4. **La lista blanca se comprueba en el servidor**, en el alta y en cada sesión. Ocultar
   el botón de registro en el front no protege nada.
5. **Nada de nombres de columna interpolados en SQL.** En la fase 1 se parametriza
   `estadoService` por columna: la columna se elige de una lista blanca literal en
   código, nunca se concatena desde la petición.

---

## La puerta y la landing

Sin sesión no se accede a nada. Se entra por una landing con el botón de login, y una vez
dentro se tiene la app entera. Estas decisiones son de arquitectura de frontend, no de
estética, y son las que evitan que el login genere tensiones con el diseño actual.

### Dónde va la puerta

**Entre `BrowserRouter` y `DeshacerProvider`, en `src/main.tsx:16`.** Ahí cuelgan siete
providers y varios llaman a la API al montarse. Si el candado se pone dentro de las
páginas o dentro de `Layout`, esos providers arrancan igual sin sesión, cobran siete 401 y
encienden los avisos de error por detrás de la landing. Con la puerta arriba, sin sesión
el árbol de la app **no se monta**: ninguna petición que falle y ningún estado que limpiar
al cerrar sesión.

### Dos shells, no uno

La landing **no va dentro de `Layout`**. `Layout` es header con búsqueda, nav de
escritorio, nav inferior de cuatro iconos, drawer de la lista y tres avisos flotantes, y
consume `useListaCompraContext`. Meter la landing ahí da una navegación que apunta a
sitios inaccesibles y un carrito con contador.

Son dos shells que comparten tokens (paleta, Fraunces + Bricolage, `rounded-xl`, naranja
500/400, insets de safe-area, vocabulario de motion) pero no cromos.

### Tres estados, no dos

La app está instalada como PWA en la pantalla de inicio. Cada arranque en frío tiene que
comprobar la sesión contra el servidor, y eso es red. Con un estado binario, Cloe vería
**la landing parpadear en cada arranque** antes de entrar. Es la peor regresión posible de
este cambio.

Estados: `comprobando` → `dentro` / `fuera`. Mientras comprueba se pinta un splash mínimo
(la marca naranja centrada sobre el fondo de la app, sin spinner ni texto). Se guarda
además una marca local de "aquí ya hubo sesión": al usuario recurrente nunca se le enseña
la landing durante la comprobación.

### El tema oscuro hay que subirlo (defecto que ya existe)

`useDarkMode` se llama dentro de `Layout` (`src/components/shared/Layout.tsx:62`) y aplica
la clase `.dark` en un `useEffect`. `index.html` no tiene script de arranque de tema, así
que **hoy ya hay un destello claro** al abrir en modo oscuro. Con la landing por delante
de `Layout`, ese destello pasa a ser una pantalla entera.

Arreglo: script de tres líneas en `index.html` que lea `localStorage` y ponga la clase
antes del primer pintado. `useDarkMode` pasa a leer el estado ya aplicado en vez de
aplicarlo. La landing necesita también su interruptor de tema.

### Rutas

La landing se sirve en `/` cuando no hay sesión; `/` sigue siendo el Catálogo cuando la
hay. Sin ruta nueva y sin redirección, así no se toca el `start_url` de la PWA.

**Conservar el destino.** Si se abre `/recetas/:id` sin sesión (un enlace compartido por
WhatsApp), la URL se mantiene durante la landing y tras entrar se aterriza en esa receta,
no en el catálogo.

### El botón que despliega

Reutiliza el vocabulario de motion que ya existe: el menú "Más" del header abre con
`{opacity: 0, y: -8, scale: 0.97}` en 150 ms y los botones usan `whileTap` 0.85–0.88. El
CTA "Entrar" despliega las opciones en el mismo sitio con esa misma curva.

Con un solo método disponible se pinta el botón directo, sin desplegable: un menú de un
elemento es peor que un botón. El despliegue aparece a partir de dos métodos.

**No se usa `<AuthView>` en la landing.** Better Auth expone los métodos imperativos, así
que el botón es propio (tipografía y naranja de la casa) y por debajo llama a
`signIn.social`. Cero dependencia visual de un tercero en la primera pantalla. `<AuthView>`
queda de reserva si algún día hace falta un formulario de correo completo.

### Diseño de la landing (opción B)

Fondo `stone-50` / `dark:gray-950`. Tarjeta centrada `max-w-md`, `bg-white` /
`dark:bg-gray-900`, `rounded-xl`, borde `gray-200` / `dark:gray-800`. Dentro: la marca (el
mismo cuadrado naranja del header con el `ChefHat`, escalado, conservando su
`shadow-orange-400/30`), el wordmark en Fraunces bold `tracking-tight`, una línea en
Bricolage y el CTA. Detrás de la marca, un resplandor radial naranja muy tenue, calibrado
por separado en claro y en oscuro. Nada más.

**Estados que la landing debe cubrir por diseño, no improvisados:**

- **Correo no invitado.** Con lista blanca este no es un caso raro, es el caso normal la
  primera vez que se enseña la app a alguien. Va dentro de la misma tarjeta, en tono
  cálido ("este correo todavía no tiene acceso, pídeselo a Karim"), y el botón vuelve a su
  sitio. No es una pantalla de error.
- Fallo de red y vuelta desde el proveedor.

### Cuenta dentro de la app

Escritorio: avatar junto al interruptor de tema, con el mismo `p-2 rounded-xl` y el mismo
hover que los otros iconos del header. Móvil: **no** se añade un quinto icono a la nav
inferior, que son cuatro zonas repartidas para el pulgar. Va al final del menú
hamburguesa, con el nombre y "Cerrar sesión".

### Superficie tocada

Entran: `src/main.tsx`, `index.html`, `src/hooks/useDarkMode.ts`, `src/pages/Landing.tsx`
(nuevo), `src/components/shared/Puerta.tsx` (nuevo), `src/components/shared/Splash.tsx`
(nuevo) y un añadido acotado a `Layout` para el menú de cuenta.

No entran: las nueve páginas, `RecetaCard`, los formularios, el drawer de la lista, el
planificador ni los avisos. **Cero cambios.** Esa es la garantía de que el diseño no se
rompe: lo que se toca es el arranque, no la app.

### Futuro: landing opción C

Aplazada, no descartada. Mosaico difuminado de fotos de recetas de fondo, o una tarjeta de
receta real flotando en escritorio. La B está pensada para que la C se monte encima sin
rehacerla. Dos condiciones cuando se retome: el texto no va sobre fotografía sin una capa
de contraste verificada en claro y en oscuro (`src/index.css` documenta los ratios AA uno
a uno), y unas 30 recetas tienen foto de relleno de Unsplash, así que el mosaico se nutre
de una selección curada, no de un `SELECT` cualquiera.

---

## Modelo de datos objetivo

```
neon_auth.<usuarios>   (gestionado por Neon Auth, no se toca)
        |
        v
  miembros(usuario_id, hogar_id, rol)      rol: admin | usuario
        |
        v
  hogares(id, nombre, creado_en)
        |
        +--> app_estado(hogar_id PK, plan, despensa, extras, pendientes, updated_at)
        +--> favoritas(hogar_id, receta_id)
        +--> recetas.hogar_id NULL = catálogo común, UUID = privada de ese hogar

  invitados(email PK, hogar_id NULL, rol, usado_en)   lista blanca
```

---

## Fase 1 · Propiedad por hogar, sin tocar el login

**La fase más larga y la más importante.** Al terminarla la app funciona *exactamente
igual que hoy*, con `APP_KEY` incluida. Desplegable y reversible por sí sola.

La idea es desacoplar el modelo de datos del proveedor de auth: si mañana se cambia de
proveedor, solo se tira la fase 2.

### Migración, en dos pasos (expand / contract)

Una migración destructiva de golpe tumbaría producción: el código desplegado consulta
`WHERE id = 1`, y en cuanto esa columna desaparece los endpoints de estado devuelven error
hasta que Vercel termine de construir el código nuevo. Por eso va partida:

- **`sql/2026-08-multiusuario.sql`** solo añade. Crea `hogares`, añade `hogar_id`, lo
  rellena y le pone un `UNIQUE`, pero **deja la columna `id`**. Código viejo y código
  nuevo funcionan a la vez. Se aplica antes de desplegar, sin ventana de caída.
- **`sql/2026-08-multiusuario-contraer.sql`** quita `id` y pasa la clave primaria a
  `hogar_id`. Se aplica **después** de desplegar y verificar.

La rama `recetarium-test` se llevó los dos pasos de una vez: los tests deben correr contra
el estado final.

### Contenido del paso 1

```sql
CREATE TABLE hogares (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre    TEXT NOT NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO hogares (id, nombre)
VALUES ('00000000-0000-0000-0000-000000000001', 'Karim y Cloe');

ALTER TABLE app_estado DROP CONSTRAINT app_estado_single_row;
ALTER TABLE app_estado ADD COLUMN hogar_id UUID REFERENCES hogares(id) ON DELETE CASCADE;
UPDATE app_estado SET hogar_id = '00000000-0000-0000-0000-000000000001';
ALTER TABLE app_estado ALTER COLUMN hogar_id SET NOT NULL;
ALTER TABLE app_estado ADD CONSTRAINT app_estado_hogar_unico UNIQUE (hogar_id);
```

El paso 2 (`-contraer.sql`) hace el `DROP COLUMN id` y mueve la clave primaria. Probar
siempre primero en la rama Neon `recetarium-test`, y sacar copia de `app_estado` antes de
tocar producción (`sql/backups/`, ignorado por git).

### Código

- `server/src/lib/hogar.js` **(nuevo)**: exporta `HOGAR_POR_DEFECTO` con ese UUID y
  `hogarDe(req)`, que de momento devuelve la constante. **Este es el interruptor de la
  fase 3**: es el único sitio donde habrá que cambiar de dónde sale el hogar.
- `server/src/services/estadoService.js`: las 10 funciones casi idénticas se colapsan en
  `getCampo(hogarId, campo)` / `setCampo(hogarId, campo, valor)`, con `campo` validado
  contra `['plan','despensa','extras','pendientes']`. Se mantienen los nombres exportados
  actuales como envoltorios de una línea para no tocar los controladores más de lo justo.
- `server/src/controllers/estadoController.js`: cada handler pasa a llamar con
  `hogarDe(req)`. Las funciones de validación no cambian.
- El `UPSERT` pasa de `ON CONFLICT (id)` a `ON CONFLICT (hogar_id)`, y de `VALUES (1, ...)`
  a `VALUES (${hogarId}, ...)`.

### Checklist

- [x] Migración aplicada en `recetarium-test` (`br-muddy-cloud-abx2ayw1`) y verificada
- [x] `sql/schema.sql` actualizado. De paso le faltaba el `);` de cierre de `app_estado`
- [x] `estadoService` parametrizado: columna validada contra lista literal antes de
      `sql.unsafe`. De 73 a 43 líneas, con los nombres exportados intactos
- [x] Los 8 controladores pasan `hogarDe(req)`; validadores sin tocar
- [x] Tests de backend verdes: 82/82. No hizo falta cambiar ninguno, van todos por HTTP
- [x] Copia de `app_estado` de producción en `sql/backups/2026-08-09-app_estado.json`
- [x] Paso 1 (expand) aplicado en producción (`br-frosty-bird-ab7ziouz`) sin caída:
      `id` intacto, `hogar_id` poblado, 8 entradas de plan y 66 de despensa conservadas
- [ ] Desplegado: la app se comporta igual que antes
- [ ] Paso 2 (`-contraer.sql`) aplicado en producción, ya con el código nuevo en vivo

---

## Fase 2 · Autenticación

Todavía sin cambiar quién lee qué. Al terminar, se puede iniciar sesión, pero los datos
siguen siendo del hogar por defecto.

### Riesgo a validar el primer día

**Cookies de sesión en la PWA de iOS.** El host de Neon Auth
(`ep-xxx.neonauth...`) no es el host de la app (`recetarium-one.vercel.app`), así que la
sesión es cross-site. Safari en iOS es agresivo con eso, y la app se usa **instalada como
PWA** (Karim en Chrome iOS, Cloe en Safari). Antes de escribir el resto de la fase:
desplegar un login mínimo a Vercel y comprobar el ciclo completo *en el iPhone de Cloe,
con la app instalada en pantalla de inicio*, no en el navegador de escritorio. Si falla,
las salidas son configurar un dominio propio para auth o pasar a esquema bearer. Descubrir
esto al final de la fase cuesta el triple.

### Trabajo

1. Provisionar Neon Auth en el proyecto Neon `learning-inventory` (rama de producción y
   rama `recetarium-test`). Habilitar Google como proveedor.
2. Instalar `@neondatabase/neon-js` y `@neondatabase/auth-ui` en el front,
   `@neondatabase/auth` en el back. Variables: `VITE_NEON_AUTH_URL` en el front,
   `NEON_AUTH_BASE_URL` en el back. En Vercel, definirlas también para preview.
3. `src/auth.ts` **(nuevo)**: el `authClient`.
4. **Subir el tema** por encima de la puerta: script en `index.html`, `useDarkMode` pasa a
   leer el estado ya aplicado. Se hace antes que la landing, porque la landing depende de
   ello. Ver "La puerta y la landing".
5. `src/components/shared/Puerta.tsx` y `Splash.tsx` **(nuevos)**: los tres estados.
   En `src/main.tsx`, la puerta va **entre `BrowserRouter` y `DeshacerProvider`**.
6. `src/pages/Landing.tsx` **(nuevo)**: opción B, con sus estados de no invitado y de
   error. Botón propio llamando a `signIn.social`, sin `<AuthView>`.
7. `Layout`: menú de cuenta (avatar en escritorio, final del hamburguesa en móvil).
8. `server/src/lib/auth.js`: `requireUser` junto a `requireKey` (todavía sin sustituirlo).
   Confirmar aquí la forma exacta de validar la sesión desde Express: o bien
   `createNeonAuth().getSession()`, o bien consultando el esquema `neon_auth` con el
   mismo cliente SQL que ya usa `server/src/lib/db.js`. Documentar cuál se eligió.
9. Migración: tabla `miembros` y tabla `invitados`. Insertar los correos de Karim (admin)
   y Cloe, ambos ligados al hogar 1.

### Checklist

- [ ] Ciclo de login verificado en iPhone con la PWA instalada
- [ ] Sesión en cookie `httpOnly` + `Secure` + `SameSite`
- [ ] `requireUser` devuelve 401 sin sesión y adjunta el usuario a `req`
- [ ] Auth funcionando también en la rama `recetarium-test`
- [ ] Sin sesión no se monta ningún provider: cero peticiones en la pestaña de red
- [ ] Sin destello claro al arrancar en modo oscuro, ni en la landing ni en la app
- [ ] Arranque en frío de la PWA con sesión: se ve splash, nunca la landing
- [ ] Enlace profundo abierto sin sesión aterriza en su destino tras entrar
- [ ] Landing revisada en claro y oscuro, móvil y escritorio, con contraste AA
- [ ] Estado "correo no invitado" implementado y probado con un correo de fuera

---

## Fase 3 · El interruptor

Cambio corto, efecto grande: aquí la app pasa a ser multiusuario de verdad.

- `hogarDe(req)` deja de devolver la constante y resuelve el hogar del usuario de la
  sesión vía `miembros`. Un único fichero.
- `requireKey` se sustituye por `requireUser` en las 13 rutas.
- `src/api/auth.ts`: `authedFetch` pasa a `credentials: 'include'` y, ante un 401,
  redirige a `/login` en vez de lanzar un `window.prompt`. Fuera `localStorage`.
- Se elimina `APP_KEY` del código y de las variables de Vercel.

### Verificación obligatoria

Crear un segundo usuario de prueba en la rama de test, y comprobar **con la API directa,
no con la UI**, que no puede leer ni escribir el estado del hogar 1. Si en algún endpoint
el hogar se puede influir desde la petición, la fase no está terminada.

---

## Fase 4 · Cerrar lecturas y repartir el catálogo

### Lecturas

Los `GET` de `plan`, `despensa`, `extras` y `pendientes` pasan a exigir sesión. En el
front hay llamadas con `fetch` pelado en `src/api/client.ts` y `src/api/estado.ts`:
unificarlas en un único `apiFetch` que ya lleve `credentials: 'include'`, en vez de
parchear los seis o siete sitios uno a uno.

Esta fase es más simple gracias a la puerta de la fase 2: como sin sesión no se monta
nada, no hay que gestionar el 401 en cada pantalla. Basta con que `apiFetch`, ante un 401
sobrevenido (sesión caducada con la app abierta), devuelva al usuario a la landing.

### Catálogo

```sql
ALTER TABLE recetas ADD COLUMN hogar_id UUID REFERENCES hogares(id) ON DELETE CASCADE;
-- NULL = catálogo común. Las 268 recetas actuales se quedan en NULL.
CREATE INDEX idx_recetas_hogar ON recetas (hogar_id);
```

Filtro de lectura: `WHERE hogar_id IS NULL OR hogar_id = $hogar`.
Escritura: sobre una receta común hace falta rol `admin`; sobre una privada, pertenecer a
ese hogar. Cuidado con el borrado lógico y con `restaurar`, que también deben respetarlo.

### Favoritas

Hoy `recetas.favorita` es una columna global: si un primo marca favorita, se marca para
todos. Pasa a tabla:

```sql
CREATE TABLE favoritas (
  hogar_id  UUID NOT NULL REFERENCES hogares(id) ON DELETE CASCADE,
  receta_id UUID NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
  PRIMARY KEY (hogar_id, receta_id)
);
INSERT INTO favoritas (hogar_id, receta_id)
SELECT '00000000-0000-0000-0000-000000000001', id FROM recetas WHERE favorita;
```

La columna `recetas.favorita` se deja un despliegue como red y se borra después. El campo
`favorita` del DTO no cambia de forma: se calcula por hogar en el `SELECT`, así que el
front y sus tests no se enteran.

### Lista blanca

`invitados(email PK, hogar_id NULL, rol, usado_en)`. En el alta: si el correo no está,
401 y no se crea nada. Si `hogar_id` es NULL, se le crea un hogar propio; si viene
relleno, se le mete en ese hogar (así se añade a una pareja). Alta de invitados por SQL
directo al principio; una pantalla de admin solo si llega a molestar.

---

## Fase 5 · Onboarding y cierre

- Usuario nuevo: hogar vacío, sin plan ni despensa. Revisar que las pantallas aguanten el
  estado vacío, sobre todo el planificador y la lista de la compra.
- Tests de backend contra `recetarium-test` (recordatorio: `server/.env.test` está
  gitignorado y el setup aborta si apunta a producción).
- `server/tests/auth.test.js` prueba hoy `requireKey`: hay que reescribirlo.
- Añadir un test de aislamiento: usuario B no ve datos de hogar A.
- Revisar los tests de front que tocan red: `sincronizacion.test.ts`,
  `despensa-context.test.tsx`, `planificador-lista.test.tsx`.

### Poner al día la documentación

La documentación arrastra afirmaciones que ya eran falsas antes de este plan. Se arregla
aquí, en un commit propio y separado del código.

**Desactualizado ya confirmado:**

- **`README.md`** dice tres veces que el proyecto usa **Drizzle ORM** (líneas 26, 46 y 71).
  Verificado: no hay Drizzle en `package.json` ni en `server/package.json` ni en el código.
  Se usa `@neondatabase/serverless` con templates SQL.
- **`docs/design.md`** es el peor. Dice que los datos viven en `recetas.json`, que la
  despensa persiste en `localStorage`, que el plan y la lista son estado de cliente. Su
  tabla de endpoints solo cubre `/recetas` (faltan `plan`, `despensa`, `extras`,
  `pendientes`) y su contrato de receta se quedó en la versión antigua: sin `guarnicion`,
  `consejos`, `tipo`, `porciones`, `precioPorPorcion` ni el bloque de nutrición. Además el
  título dice "Arquitectura de la aplicación", que pisa a `docs/arquitectura-datos.md`.
- **`docs/context.md:43`**: dice que `DespensaContext` persiste en `localStorage`. Va
  contra el backend vía `useEstadoCompartido` desde hace tiempo; el `localStorage` que
  queda en `DespensaContext.tsx:65` es solo la migración del formato viejo.

**Que hay que auditar además** (no verificado en detalle todavía): `docs/api.md`,
`docs/api-client.md`, `docs/arquitectura-datos.md`, `docs/hooks.md`, `docs/components.md`,
`docs/routing.md`, `docs/testing.md`, `docs/seguridad-db.md`, `docs/deployment.md` y el
`docs/swagger.json`.

**Que NO se toca:** `docs/retrospective.md`, `docs/agile.md`, `docs/idea.md`,
`docs/project-management.md` y `docs/PLAN-nutricion-y-50-recetas.md` son documentos
históricos, registro de un momento concreto. Reescribirlos para que "digan la verdad de
hoy" destruye justamente su valor. Si acaso, una nota de fecha al principio.

**Añadir por este plan:** auth y sesiones en `docs/seguridad-db.md`, el modelo de hogares
en `docs/arquitectura-datos.md`, las variables de entorno nuevas en `docs/deployment.md`,
y la landing y la puerta en `docs/design.md` una vez reescrito.

**Checklist**

- [ ] `README.md` sin Drizzle
- [ ] `docs/design.md` reescrito contra el código real
- [ ] `docs/context.md` corregido en lo de la despensa
- [ ] Resto de docs auditados, uno a uno
- [ ] Swagger regenerado y `/api/docs` comprobado
- [ ] Documentos históricos dejados en paz

---

## Cómo ejecutar esto barato en tokens

1. **Una fase por sesión y por commit.** No abrir dos fases a la vez.
2. **Leer este documento, no re-explorar el repo.** Los ficheros a tocar están arriba.
3. **Aprovechar los embudos.** `authedFetch` y `requireKey` son dos ficheros que cubren
   las 13 rutas. No se edita ruta por ruta.
4. **Ediciones dirigidas, no reescrituras.** `estadoController.js` son 130 líneas de
   validación que no cambian: solo cambia la llamada al servicio.
5. **Grep antes que leer.** Para encontrar los `fetch` sin `credentials`, un grep, no
   abrir los ficheros enteros.
6. **No tocar los tests que no fallan.** Ejecutar, y arreglar solo lo rojo.
7. Al cerrar cada fase, marcar su checklist **en este fichero**, para que la siguiente
   sesión sepa dónde está sin preguntar.

---

## Riesgos, ordenados por lo que duelen

1. **Cookie cross-site en la PWA de iOS.** Se valida el primer día de la fase 2.
2. **IDOR**: el hogar filtrándose desde la petición. Se cubre con la verificación
   obligatoria de la fase 3.
3. **La migración de `app_estado`** toca la tabla que guarda todo el estado vivo. Rama de
   test primero, y `pg_dump` de la tabla antes de aplicarla en producción.
4. **Cambio de proveedor a mitad.** Mitigado por el orden de las fases: solo se tira la 2.
5. **Arranque en frío de Neon** al añadir consultas de sesión en cada petición. Vigilar si
   se nota; la sesión vive en la misma BD, así que no añade un salto de red nuevo.
