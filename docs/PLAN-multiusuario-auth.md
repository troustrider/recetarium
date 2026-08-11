# Recetarium: plan multiusuario + autenticación

> Documento de trabajo para ejecutar desde **Claude Code** en el repo `recetarium/`.
> Ejecutar las fases **en orden**. Cada fase es un commit desplegable y reversible.
>
> **Este fichero es la fuente de verdad del plan.** Léelo entero al empezar una sesión
> de implementación y no re-explores el repo: los ficheros que hay que tocar están
> listados en cada fase.

---

## Estado: fases 1 a 4 terminadas y en producción

La app es multiusuario, con acceso por invitación, hogares que comparten estado, y un catálogo
común sobre el que cada hogar puede tener recetas privadas y sus propias favoritas. Suite: 10
ficheros y 105 tests de backend, 19 y 277 de frontend.

**Lo único que queda de este plan:**

- Quitar `recetas.favorita`, que se dejó un despliegue como red por si había que volver atrás.
  Un comando: `sql/2026-08-favorita-columna-fuera.sql`. No corre prisa y no molesta a nadie.
- Borrar `APP_KEY` de las variables de Vercel. Ya no la lee nadie; es una credencial huérfana.

**Y dos cosas que no son de este plan pero salieron de él**, guardadas en memoria para que no
se caigan: evaluar la migración a Clerk por las vulnerabilidades de `better-auth`, y la landing
opción C.

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
2. **El token de sesión no se guarda nunca en `localStorage`.** Lo lee cualquier script
   inyectado. Vive en memoria, y lo custodia el cliente de Neon Auth.

   *Corrección sobre la versión inicial de este plan:* aquí ponía que la sesión iría en
   una cookie `httpOnly` que el backend leería. **No puede ser así.** El servicio de auth
   corre en otro host (`*.neonauth.aws.neon.tech`), así que su cookie de sesión nunca
   llega a `recetarium-one.vercel.app/api/*`. El token va en `Authorization: Bearer`, y el
   cliente lo obtiene de `getSession()`, que lo devuelve en el cuerpo de la respuesta.
   La cookie sigue existiendo, pero solo entre el navegador y el servicio de auth.
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
- [x] Desplegado (`addfeab`, Vercel READY) y verificado en vivo antes de contraer
- [x] Paso 2 (`-contraer.sql`) aplicado en producción y verificado después: 8 entradas de
      plan y 66 ingredientes intactos, `/recetas` en 200

**Fase 1 terminada.**

---

## Fase 2 · Autenticación

Todavía sin cambiar quién lee qué. Al terminar, se puede iniciar sesión, pero los datos
siguen siendo del hogar por defecto.

### Cómo se configura Neon Auth (importante)

**El tool MCP `configure_neon_auth` no sirve para todo.** Su esquema viene sin tipos, así
que cualquier parámetro que sea un objeto (como `methods`) llega al servidor como texto y
lo rechaza. Los parámetros de texto sí funcionan (`add_trusted_origin`).

Para lo demás, **la CLI**, que sí lo cubre entero:

```bash
npx -y neonctl@latest neon-auth config email-password update --project-id rapid-dust-88814325 --branch <rama> --disable-sign-up
```

Otros subcomandos útiles: `neon-auth status`, `neon-auth config email-password get`,
`neon-auth oauth-provider list|add|update`, `neon-auth domain`, `neon-auth user`.

### Estado de la configuración (rama `recetarium-test`)

- Base URL: `https://ep-gentle-field-abm7rrx3.neonauth.eu-west-2.aws.neon.tech/neondb/auth`
- Google: activo, tipo `shared`. **No hace falta pasar por Google Cloud Console.**
- Correo y contraseña: método habilitado pero **`allow_sign_up: false`**. Nadie se registra
  solo; el alta la controla la lista blanca.
- `trusted_origins`: `https://recetarium-one.vercel.app`. `allow_localhost: true`.
- Falta replicar todo esto en la rama de producción cuando llegue el momento.

### Deuda aceptada: vulnerabilidades de better-auth

Los paquetes beta de Neon fijan `better-auth@1.4.18`, con 5 vulnerabilidades sin ruta de
arreglo (una crítica, varias altas), parcheadas en 1.6.11+. `npm audit` queda en rojo y no
se puede cerrar desde el proyecto. Decisión consciente por ser tres usuarios de confianza.
Compromisos asociados, que no se deben dejar caer:

1. Evaluar la migración a Clerk a corto-medio plazo, o comprobar si Neon ya subió su beta.
2. **Monitorización de sesiones: hecha.** Dos vías, porque el día que sospeches de un
   acceso puede que no quieras entrar por la app:
   - `node server/scripts/sesiones.mjs` (añade `--test` para la rama de pruebas,
     `--dias N` para la ventana). Saca resumen por usuario, IPs nuevas y últimas sesiones.
   - Pantalla `/admin/sesiones`, servida por `GET /api/v1/admin/sesiones`, protegida con
     `requireUser` + `requireAdmin`.

   Lo que de verdad avisa es el bloque de **IPs vistas por primera vez**: con tres
   usuarios, una IP desconocida es señal suficiente. Si aparece, la migración a Clerk pasa
   a ser inmediata.

### Cómo verifica la sesión el backend

Neon Auth guarda todo en el esquema `neon_auth` de **esta misma base de datos**, así que
validar una sesión es un JOIN y no un salto de red:

```
neon_auth.user     id, name, email, emailVerified, image, role, banned, banReason…
neon_auth.session  id, token (UNIQUE), userId, expiresAt, ipAddress, userAgent…
neon_auth.account  proveedor OAuth por usuario
```

`requireUser` lee `Authorization: Bearer`, busca `session.token` (que tiene índice único,
`session_token_key`, así que es un acierto directo), comprueba `expiresAt`, descarta
cuentas con `banned`, y resuelve el hogar por `miembros`.

**Aviso sobre el SDK:** `getJWTToken()` **no devuelve un JWT**. Su implementación real
devuelve `session.data.session.token`, el token opaco de Better Auth, el mismo valor que
está en `neon_auth.session.token`. El nombre engaña; comprobado leyendo el código
compilado, no la documentación. Por eso el backend no necesita `jose` ni la JWKS.

Ventaja no buscada: revocar es borrar la fila de `session`, con efecto inmediato. Con un
JWT habría que esperar a que caducara.

**`neon_auth.session` guarda `ipAddress` y `userAgent`.** Eso es exactamente la
monitorización de accesos que hay pendiente: sale con una consulta, sin servicio externo.

### Sobre las claves ajenas a `neon_auth`

`miembros.usuario_id` **no** lleva `FOREIGN KEY` a `neon_auth.user(id)`, aunque se pueda.
Es el esquema de un servicio gestionado y Neon puede recrear sus tablas en cualquier
migración suya, lo que dejaría la nuestra bloqueada o rota. El JOIN funciona igual, que es
lo que se necesita. Contra `hogares`, que es nuestra, sí hay FK con `ON DELETE CASCADE`.

### El arranque en frío de la PWA: probado, falla, y cómo se resolvió

**Resultado de la prueba en un iPhone (iOS 18.7), 2026-08-10.** El login con Google
funciona y la sesión queda bien guardada en la base de datos. Pero al cerrar la app del
todo y volver a abrirla desde la pantalla de inicio, **la sesión se pierde**: la cookie
vive en el host de Neon, no en el de la app, y Safari no la conserva entre arranques de una
PWA instalada.

Dos salidas descartadas con pruebas, no por intuición:

- **Token en la cabecera contra el servicio de auth.** Better Auth trae el plugin `bearer`
  para esto. Un token válido en `Authorization` contra `get-session` devuelve `null`:
  Neon **no lo tiene activado**, y `neonctl neon-auth plugins list` confirma que no está
  entre los configurables (solo `organization`, `magic_link`, `phone_number`,
  `email_provider`, `email_and_password`, `oauth_providers`).
- **Proxy en el dominio propio** para que la cookie fuese de primera parte. No sirve: el
  callback de Google aterriza en el dominio de Neon, porque es el `redirect_uri` registrado
  en sus credenciales compartidas de Google, y la cookie se sigue poniendo allí.

**Lo que se hizo.** La fuente de verdad de la sesión pasa a ser **nuestra API**, que ya
validaba el token contra `neon_auth.session` sin necesitar la cookie. El cliente guarda el
token al entrar (único momento en que la cookie vale) y en cada arranque pregunta a
`GET /api/v1/yo`. La cookie deja de importar.

**El precio, asumido a conciencia.** El token vive en `localStorage`, en contra de la regla
que este mismo documento fija más arriba. La alternativa era entrar con Google en cada
arranque, también en el supermercado. Es el mismo compromiso que acepta cualquier app
móvil. Se acota con:

- **CSP en `vercel.json`** con `script-src 'self'`, sin `'unsafe-inline'`: sin poder
  inyectar script, un XSS no puede leer el token. Por eso el script del tema se movió a
  `public/tema.js`, para no necesitar un hash que se rompa al editarlo.
- **Revocación inmediata**: `DELETE /api/v1/yo/sesion` borra la fila, y el token muere en
  el momento. Verificado.
- **Aviso de IPs nuevas** en `/admin/sesiones`.

**Nota:** los ficheros de `public/` se sirven sin minificar, así que sus comentarios se ven
en el código fuente. `tema.js` va sin ellos a propósito.

Van tres pegas de Neon Auth (beta, dependencia vulnerable, y esto). Cuenta para la decisión
aplazada sobre Clerk, en `[[recetarium-auth-deuda-clerk]]`.

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

- [x] Neon Auth provisionado en `recetarium-test`, config cerrada, Google activo
- [x] `src/auth.ts` con `createAuthClient` + `BetterAuthReactAdapter`. API confirmada
      contra los `.d.mts` instalados, no de memoria; `tsc -b` limpio
- [x] Tema subido por encima de la puerta (script en `index.html`, hook solo lee)
- [x] `/acceso`, página de diagnóstico temporal, verificada en local: el servicio
      responde 200 y `useSession` resuelve sin error
- [x] Tablas `miembros` e `invitados` (`sql/2026-08-auth-hogares.sql`), aplicadas en
      `recetarium-test`. Karim sembrado como admin del hogar compartido
- [x] `requireUser` y `requireAdmin` en `server/src/lib/auth.js`, con el alta automática
      desde la lista blanca en el primer inicio de sesión
- [x] `server/tests/auth-usuario.test.js`: 10 tests verdes. Cubre sesión ausente,
      inventada y caducada, correo no invitado, cuenta suspendida, alta en hogar
      compartido, alta con hogar propio, idempotencia y rol admin
- [x] Suite de backend completa: 9 ficheros, 92 tests
- [x] `VITE_NEON_AUTH_URL` en Vercel. Ojo: la primera vez entró con una errata (`autH`),
      y al estar marcada «Sensitive» no se puede leer para comprobarla
- [x] Ciclo de login verificado en iPhone: entra bien, **pero la sesión no sobrevive al
      arranque en frío**. Ver la sección del arranque en frío
- [x] Sesión por token propio + `GET /api/v1/yo`, CSP en `vercel.json`
- [x] Puerta de tres estados, splash y landing (opción B). Verificado en local: landing sin
      sesión, app entera con sesión, salir instantáneo, revocación efectiva, oscuro con la
      paleta de la casa y sin desbordamiento a 375px
- [x] Menú de cuenta: avatar en escritorio, final del hamburguesa en móvil, sin quinta
      pestaña en la nav inferior
- [x] Correo de Cloe en `invitados` del hogar compartido (rama de pruebas)
- [x] Producción lista: Neon Auth provisionado (`ep-winter-scene-abiwxo8p`, **distinta de la
      de pruebas**), tablas `miembros` e `invitados`, alta libre desactivada, origen de
      confianza, y Karim (admin) y Cloe invitados al hogar compartido
- [x] Desplegado y verificado en producción: landing sin sesión y sin los cromos de la app,
      cero errores de consola con la CSP puesta, Fraunces y Bricolage cargando, cabeceras
      de seguridad presentes, y el botón redirige a Google contra la URL de producción
- [x] **Arranque en frío verificado en el iPhone**: se cierra la app del todo, se reabre
      desde el icono y entra directa al catálogo. La sesión sobrevive

**Fase 2 terminada.**

### El token del cliente es un JWT, no un token opaco

Costó dos rondas y conviene que quede escrito. `authClient.getSession()` devuelve en
`session.token` un **JWT firmado** (~840 caracteres, tres segmentos), no el valor opaco de
`neon_auth.session.token`. Por eso el provisionado da una URL de JWKS.

`requireUser` distingue las dos formas: tres segmentos se verifican con `jose` contra el
JWKS (la clave se descarga una vez y se cachea); cualquier otra cosa se busca en
`neon_auth.session`, que es lo que usan los tests, porque emitir un JWT válido exigiría la
clave privada del servicio.

La URL del JWKS se deriva de `VITE_NEON_AUTH_URL`, que Vercel expone también a la función
serverless. Así no hay una segunda variable que se pueda desincronizar de la primera.

**Trampa en la que caí:** leer la implementación genérica de `getJWTToken` en `better-auth`
y concluir que devolvía un token opaco. En el servicio gestionado de Neon no es así. Lo que
lo resolvió fue instrumentar el cliente y mirar la longitud y la forma reales del token.

### Cosas pendientes que salieron de la fase 2

- **Dos arranques para estrenar despliegue.** El service worker sirve el bundle cacheado en
  el primer arranque tras un despliegue; hay que cerrar y abrir dos veces. Afecta a
  cualquier actualización futura, también a Cloe.
- **Sesiones que se acumulan.** Cada inicio de sesión deja una fila en `neon_auth.session`
  y duran siete días, así que un día de pruebas dejó 44 activas. **No es una fuga de la
  app**: se comprobó que salen en ráfagas coincidentes con los logins, y `capturarToken`
  solo llama al servicio de auth cuando no hay token guardado, así que abrir la app no crea
  ninguna. Resuelto con `node server/scripts/sesiones.mjs --limpiar`, que borra las
  caducadas sin cerrar ninguna sesión viva.

> **Orden que no se puede invertir.** `VITE_NEON_AUTH_URL` tiene que apuntar a la auth de
> la MISMA rama que la base de datos que valida el token. Si el bundle mira a pruebas y la
> API a producción, el login entra pero `GET /yo` devuelve 401 y la app queda en bucle
> contra la landing, sin forma de entrar.
### Cierre de la lista original de la fase 2

- [x] `requireUser` devuelve 401 sin sesión y adjunta el usuario a `req`
- [x] Auth funcionando también en la rama `recetarium-test`
- [x] Sin sesión no se monta ningún provider
- [x] Sin destello claro al arrancar en modo oscuro
- [x] Arranque en frío de la PWA con sesión: splash, nunca la landing
- [x] Enlace profundo: la landing conserva la ruta y se vuelve a ella al entrar
- [x] Landing revisada en claro y oscuro, móvil y escritorio, con contraste AA
- [x] Estado "correo no invitado" implementado. Probado en los tests del backend
      (`auth-usuario.test.js`), que es donde se decide; en la interfaz es el texto de la
      landing
- ~~Sesión en cookie `httpOnly`~~ **descartado**, no es posible: ver la sección del
  arranque en frío. El token va en `Authorization`.

---

## Fase 3 · El interruptor

Cambio corto, efecto grande: aquí la app pasa a ser multiusuario de verdad.

- [x] `hogarDe(req)` sale de `req.usuario.hogarId`. **Lanza** si no hay sesión en vez de
      caer en un hogar por defecto: un fallo ruidoso en una ruta mal configurada es
      preferible a servir en silencio los datos del hogar equivocado.
- [x] `requireUser` sustituye a `requireKey` en las 13 rutas.
- [x] **Los cuatro endpoints de estado exigen sesión también en lectura**, no solo en
      escritura. Esto se adelanta de la fase 4 porque era un fallo de corrección, no de
      seguridad: con los `GET` abiertos, un usuario con hogar propio leería la despensa del
      hogar 1 y escribiría en la suya.
- [x] `src/api/http.ts` **(nuevo)**: un único `apiFetch` que pone el token y, ante un 401
      sobrevenido, olvida el token y recarga para que la puerta haga el resto. `client.ts` y
      `estado.ts` pasan por ahí; fuera el `src/api/auth.ts` de la passphrase.
      `yo.ts` no lo usa a propósito: ahí un 401 es la respuesta normal de "no has entrado",
      y recargar sería un bucle.
- [x] `APP_KEY` fuera del código y de `.env.example`. **Queda borrarla en Vercel**, donde ya
      no la lee nadie.
- [x] Tests: `auth.test.js` reescrito por completo. Los helpers crean sesiones de verdad en
      `neon_auth` y el `setup` global purga lo creado, para que ningún fichero tenga que
      acordarse. Suite: 9 ficheros, 96 tests.

### Verificación obligatoria: hecha, y automatizada

En `auth.test.js` hay dos tests que la cubren y quedan como red permanente:

- Un usuario de otro hogar pide `/despensa` y recibe `[]`, no la del hogar 1. Y lo que
  escribe no toca la ajena.
- Intentar nombrar otro hogar desde la petición (`?hogar=`, `?hogarId=`, `?hogar_id=`) se
  ignora: sigue devolviendo lo del hogar de la sesión.

Más los de siempre: sin sesión, 401 en las 8 escrituras y en las 4 lecturas de estado; con
un token inventado, 401; y la sesión se valida antes que el cuerpo, así que un payload
inválido sin sesión sigue siendo 401 y no 400.

El catálogo sigue leyéndose sin sesión; eso lo cierra la fase 4.

### Nota histórica

Crear un segundo usuario de prueba en la rama de test, y comprobar **con la API directa,
no con la UI**, que no puede leer ni escribir el estado del hogar 1. Si en algún endpoint
el hogar se puede influir desde la petición, la fase no está terminada.

---

## Fase 4 · Cerrar lecturas y repartir el catálogo

**Terminada.** `sql/2026-08-catalogo-por-hogar.sql`.

- [x] `GET /recetas` y `GET /recetas/:id` exigen sesión. Los de estado ya lo hacían desde
      la fase 3, adelantados por corrección
- [x] `recetas.hogar_id`: NULL es catálogo común, un UUID es receta privada de ese hogar
- [x] Tabla `favoritas` por hogar, con las que ya estaban marcadas migradas al hogar
      compartido. El DTO no cambia de forma: `favorita` se deriva con un `EXISTS`, así que el
      front no se entera
- [x] Permisos: el catálogo común solo lo edita un admin; una receta privada, su hogar.
      Marcar favorita **no** es editar, así que cualquiera puede marcarse las del común
- [x] Invitaciones desde la interfaz, en la pantalla de Accesos
- [x] `server/tests/catalogo-hogar.test.js`: 9 tests. Suite: 10 ficheros, 105 tests
- [ ] `recetas.favorita` sigue en la tabla como red de un despliegue.
      `sql/2026-08-favorita-columna-fuera.sql` la quita cuando esto lleve un rato en vivo

### Dos decisiones que conviene no reabrir

**Las cinco lecturas se colapsaron en una.** `getAll` tenía cuatro `SELECT` casi idénticos
para las combinaciones de filtros, más el de `getById`. Con el filtro por hogar de por
medio, bastaba con olvidarlo en uno para que un hogar viese las recetas privadas de otro.
Ahora hay una sola consulta con los filtros como condiciones opcionales.

**Una receta de otro hogar responde 404, no 403.** Decir "no tienes permiso" confirmaría
que existe. Solo el catálogo común devuelve 403, porque su existencia no es secreta. Por
eso `duenoDe()` no filtra por `borrada_en`: restaurar actúa justo sobre una borrada.

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

- [x] `README.md` sin Drizzle
- [x] `docs/design.md` reescrito contra el código real: rutas, componentes, contextos,
      endpoints y contrato de datos verificados uno a uno contra el código, no de memoria
- [x] `docs/context.md` corregido: la despensa va contra el backend, no `localStorage`
- [x] Resto auditados. Lo que estaba mal y se ha corregido:
      - `api-client.md` decía que todo pasaba por `client.ts`; ahora es `http.ts`, y faltaba
        `restoreReceta`
      - `routing.md` listaba `/lista-compra` como ruta (es un drawer), le faltaba
        `/admin/sesiones`, y describía un `Layout` con `<Outlet />` que no es el que hay
      - `deployment.md` tenía el `includeFiles` viejo y no mencionaba `VITE_NEON_AUTH_URL`
      - `api.md` no decía que todo exige sesión ni los permisos por rol
      - `arquitectura-datos.md` solo conocía dos tablas de siete
      - `seguridad-db.md` estaba bien; se le añade el caso de `sql.unsafe` y el aislamiento
        entre hogares
- [x] Swagger regenerado, 13 rutas. `server/scripts/export-swagger.js` estaba **roto**: usaba
      `require` sobre un módulo ESM. Arreglado
- [x] Documentos históricos dejados en paz: `retrospective.md`, `agile.md`, `idea.md`,
      `project-management.md` y `PLAN-nutricion-y-50-recetas.md`

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
