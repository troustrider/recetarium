# Testing

Stack: **Vitest 4**, **React Testing Library** y **jsdom** en el frontend; Vitest contra
una rama real de Neon en el backend.

`vitest.config.ts` define dos proyectos:

| Proyecto | Entorno | Qué cubre |
|---|---|---|
| `web` | jsdom, sin red | Lógica de dominio, hooks y componentes del frontend |
| `server` | node, con base de datos | API, permisos, aislamiento entre hogares y nutrición |

```bash
npm test              # watch
npm run test:web      # 20 ficheros
npm run test:server   # 10 ficheros
npm run test:coverage
```

> Vitest a veces recoge solo parte de los ficheros y sale verde igual. Conviene mirar el
> número de ficheros recogidos y no solo el "passed".

## Proyecto `web`

Corre sin red y no necesita configuración. Cubre sobre todo la lógica que decide qué se
compra, qué se gasta y qué se enseña:

| Área | Ficheros |
|---|---|
| Lista de la compra y despensa | `listaCompra-cantidades`, `despensa`, `despensa-context`, `cantidades`, `consumo`, `desglose`, `ingredientes` |
| Recetas y escalado | `escalarPasos`, `guarnicion`, `parseDuracion`, `RecetaCard`, `useFiltros`, `useRecetas-deshacer` |
| Estado compartido y deshacer | `sincronizacion`, `deshacer`, `planificador-lista` |
| Cocina | `useTimers` |
| Precios y PWA | `precios`, `caducidad-estimada`, `manifests` |

Algunos fijan contratos que no son evidentes leyendo el código: `ingredientes.test.ts`
cubre `claveIngrediente`, que agrupa la lista y persiste lo marcado como comprado, así
que cambiar su forma pierde los marcados del usuario; `manifests.test.ts` comprueba que
los dos manifests siguen siendo idénticos salvo en el color de fondo.

`precios.test.ts` no fija cuánto vale el pollo — los precios cambian y la tabla se
actualiza con `npm run precio` — sino el comportamiento: que una entrada específica gane
a la genérica, que lo inconvertible devuelva `null` en vez de inventarse una conversión,
y que un precio absurdo salte.

## Proyecto `server`

Escribe de verdad: crea y borra recetas, usuarios y hogares. Corre contra la rama
`recetarium-test` de Neon, configurada en `server/.env.test`, que no está en el
repositorio. `server/tests/setup.js` aborta si `DATABASE_URL` no apunta a esa rama, y
purga al terminar cada fichero lo que hayan creado los helpers.

| Fichero | Qué fija |
|---|---|
| `auth.test.js` | La sesión decide qué hogar se toca y nadie ve el de otro |
| `auth-usuario.test.js` | Un token de `neon_auth.session` resuelve a usuario y hogar; un JWT que no verifica se rechaza |
| `catalogo-hogar.test.js` | Catálogo común editable solo por admin, recetas privadas invisibles para el resto, favoritas por hogar |
| `recetas-crud.test.js` | Alta, edición y contrato de la respuesta |
| `recetas-borrado.test.js` | El borrado lógico devuelve la receta con su mismo id |
| `estado.test.js` | Plan, despensa, extras y pendientes por hogar |
| `guarnicion.test.js` | La guarnición no contamina la ficha del plato, sobre todo el gluten |
| `nutricion.test.js` | Macros, micros y gluten calculados desde los ingredientes |
| `validacion-recetas.test.js` | Validación de entrada |
| `precios-contraste.test.js` | La tabla de precios contra los precios curados de las recetas |

Toda la API pide sesión, así que los helpers escriben una a mano en `neon_auth` con token
opaco: no hay forma de completar un login real desde un test, y emitir un JWT válido
exigiría la clave privada del servicio gestionado. `requireUser` acepta las dos formas.

## Integración continua

`.github/workflows/ci.yml` corre lint y el proyecto `web` en cada push. El proyecto
`server` se queda en local: necesitaría la credencial de la rama de Neon como secret.
