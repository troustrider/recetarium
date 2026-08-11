# Arquitectura de la aplicación

## Visión general

React en el frontend, Express en el backend y Neon Postgres como base de datos. El backend
entero corre como **una sola función serverless** en Vercel (`api/index.js`, ver
`vercel.json`), así que el frontend y la API comparten origen y el `/api/*` se resuelve con
un rewrite.

```
Usuario → React → src/api/http.ts → Express (/api/v1) → Neon Postgres
```

El frontend no guarda datos: todo vive en el servidor. Lo único en `localStorage` es el
token de sesión y la preferencia de tema.

## Acceso

**Sin sesión no se ve nada.** La puerta (`src/components/shared/Puerta.tsx`) está por encima
de los providers de datos, así que sin sesión el árbol de la app ni se monta y nadie pide a
la API. Tiene tres estados: mientras comprueba enseña el splash, y solo después decide entre
la app y la landing.

El acceso es **por invitación**: sin fila en `invitados` no se entra, aunque se tenga cuenta
de Google. El alta ocurre sola en el primer inicio de sesión.

La unidad de propiedad es el **hogar**, no el usuario: varias personas pueden compartir
despensa, plan y lista. El catálogo de recetas es común a todos.

Los detalles, y las trampas encontradas por el camino, en
[PLAN-multiusuario-auth.md](PLAN-multiusuario-auth.md).

## Frontend

### Páginas

| Ruta | Componente | Qué hace |
|------|------------|----------|
| `/` | `Catalogo` | Catálogo de recetas con filtros y búsqueda |
| `/favoritas` | `Favoritas` | Recetas marcadas como favoritas por el hogar |
| `/planificador` | `Planificador` | Calendario semanal con drag & drop |
| `/despensa` | `Despensa` | Inventario de ingredientes en casa |
| `/recetas/nueva` | `NuevaReceta` | Formulario para crear una receta |
| `/recetas/:id` | `DetalleReceta` | Detalle de una receta, con modo cocina |
| `/recetas/:id/editar` | `EditarReceta` | Formulario para editar |
| `/admin/sesiones` | `AdminSesiones` | Accesos e invitaciones. Solo admin |
| `*` | `NotFound` | Página 404 |

La lista de la compra **no es una ruta**: es un drawer (`ListaCompraDrawer`) que se abre
desde el carrito del header y desde la nav inferior en móvil.

### Estructura de componentes

```
src/components/
  shared/       Layout, Puerta, Splash, Marca, Avatar, FiltroBar, avisos,
                LoadingSpinner, ErrorMessage, InstallPrompt
  recetas/      RecetaCard, RecetaForm, IngredienteItem, FichaMicros, AbanicoRecetas
  despensa/     TarjetaIngrediente, AnadirIngrediente, FichaIngrediente, AvisoDespensa
  lista-compra/ ListaCompraDrawer, ResumenIngrediente, AnadirManual
  cocina/       ModoCocina
  admin/        Invitaciones
```

### Gestión de estado

**Context API** para lo global. Cuatro trozos se sincronizan con el servidor a través de
`useEstadoCompartido`, que carga al montar, guarda con debounce y revalida al volver a la
pestaña, sin pisar lo que se haya tocado mientras tanto:

- `RecetasContext` — catálogo cargado de la API
- `DespensaContext`, `PlanificadorContext`, `PendientesPlanContext`, `CompradosContext`
- `ListaCompraContext` — selección para la compra, derivada en `useListaCompra`
- `DeshacerContext` — ranura única para la última acción reversible
- `SesionContext` — usuario, hogar, rol y estado de la sesión

**Estado local** en cada componente: filtros activos, estado del formulario y estados de red.

## Backend

### Estructura por capas

```
server/src/
  routes/       endpoints y middlewares de acceso
  controllers/  validan la petición, deciden permisos, llaman al servicio
  services/     lógica de negocio y acceso a datos
  lib/          db, auth, hogar, cálculo nutricional
  config/       swagger
```

`lib/auth.js` tiene `requireUser` (valida el JWT contra el JWKS de Neon Auth, o el token
opaco contra `neon_auth.session`) y `requireAdmin`. `lib/hogar.js` resuelve el hogar **desde
la sesión y nunca desde la petición**, y lanza si falta: un fallo ruidoso es preferible a
servir los datos del hogar equivocado.

### Endpoints

Todos bajo `/api/v1` y todos exigen sesión.

| Método | Ruta | Qué hace |
|--------|------|----------|
| GET | `/yo` | Quién soy: usuario, hogar y rol |
| DELETE | `/yo/sesion` | Cierra la sesión, borrando sus filas |
| GET | `/recetas` | Catálogo común más las privadas del hogar. Filtros por query |
| GET | `/recetas/:id` | Una receta |
| POST | `/recetas` | Crea. Admin escribe en el común; el resto, privada suya |
| PUT | `/recetas/:id` | Actualiza. El común solo un admin; la privada, su hogar |
| PATCH | `/recetas/:id/favorita` | Marca o desmarca **para el hogar** |
| DELETE | `/recetas/:id` | Borrado lógico |
| POST | `/recetas/:id/restaurar` | Deshace el borrado, conservando el id |
| GET/PUT | `/plan` | Plan semanal del hogar |
| GET/PUT | `/despensa` | Despensa del hogar |
| GET/PUT | `/extras` | Extras de la lista de la compra |
| GET/PUT | `/pendientes` | Compradas pendientes de planificar |
| GET | `/admin/sesiones` | Accesos: IPs, dispositivos, IPs nuevas. Solo admin |
| GET/POST | `/admin/invitados` | Lista blanca. Solo admin |
| DELETE | `/admin/invitados/:email` | Retira una invitación no usada. Solo admin |

Documentación interactiva en `/api/docs` (Swagger UI).

### Contrato de datos

```json
{
  "id": "uuid",
  "nombre": "string",
  "categoria": "string",
  "sabor": "salado | dulce | amargo | umami | acido",
  "tiempoPreparacion": 30,
  "tipo": "principal | postre | desayuno | entrante",
  "porciones": 2,
  "precioPorPorcion": 1.5,
  "favorita": false,
  "privada": false,
  "imagen": "url o null",
  "ingredientes": [{ "nombre": "…", "cantidad": 200, "unidad": "g", "familia": "…" }],
  "pasos": ["string"],
  "consejos": ["string"],
  "guarnicion": { "nombre": "…", "ingredientes": [], "pasos": [], "…ficha nutricional": null },
  "calorias": 520, "proteinas": 41, "carbohidratos": 55, "grasas": 12,
  "hierro": 3.2, "sinGluten": true, "micros": {}
}
```

`categoria` es texto libre; el formulario normaliza a minúsculas y sugiere las existentes.
`sabor` es enum cerrado. `favorita` y `privada` **se derivan del hogar que pregunta**, no son
columnas de la receta. La nutrición y el gluten los calcula siempre el servidor desde los
ingredientes, nunca del payload.

## Qué vive dónde

| Dato | Dónde vive |
|------|------------|
| Recetas | Neon, tabla `recetas`. `hogar_id` nulo es catálogo común |
| Favoritas | Neon, tabla `favoritas`, por hogar |
| Plan, despensa, extras, pendientes | Neon, `app_estado`, una fila por hogar |
| Usuarios y sesiones | Neon, esquema `neon_auth`, gestionado por Neon Auth |
| Quién es de qué hogar | Neon, `miembros`. Lista blanca en `invitados` |
| Token de sesión | Cliente, `localStorage` (ver el plan para el motivo) |
| Preferencia de tema | Cliente, `localStorage`, aplicada antes del primer pintado |
| Filtros activos y estado de formularios | Cliente, estado local |
| Lista de la compra generada | Cliente, calculada en `useListaCompra` |
