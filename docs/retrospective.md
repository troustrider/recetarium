# Retrospectiva

## Qué aprendí conectando frontend, backend y API

Lo más importante fue entender que React no es "la app" sino solo la capa visual. Hasta esta fase construía interfaces que funcionaban, pero los datos venían de localStorage y todo vivía en el navegador. Conectar eso a un servidor real cambió cómo pienso en el flujo de datos: lo que muestra la UI es temporal, lo que importa es lo que devuelve la API.

También aprendí a distinguir cuándo un problema está en el cliente (estado, renders, tipos) y cuándo está en la red (CORS, status codes, formato del body). Antes los confundía bastante.

En TypeScript empecé a ver el valor de tener los tipos definidos en un solo sitio. Que `Receta` sea el mismo tipo en el cliente API y en el formulario elimina una categoría entera de errores que antes ni veía.

## Principales problemas encontrados

**Conflicto ESM/CJS en Vercel.** El problema que más tiempo me costó. El `package.json` raíz tiene `"type": "module"` (ESM), pero el servidor usa `require()` (CJS). Cuando intenté que `api/index.js` hiciera de puente con sintaxis CJS, Node lanzó un error de `module is not defined`. La solución fue escribir ese archivo en ESM y dejar el servidor con su propio `package.json` marcado como CJS.

**Filesystem de solo lectura en producción.** En Vercel no puedes escribir en el filesystem. Las escrituras en el JSON fallaban silenciosamente, así que `toggleFavorita` devolvía siempre el mismo valor y el botón de favoritos no respondía. Lo corregí haciendo el toggle en el estado del frontend directamente, sin esperar a que el servidor confirme el nuevo valor.

**La variable de entorno evaluada en build time.** `VITE_API_URL` se incrusta en el bundle cuando Vite compila, no cuando el usuario abre la app. Si la configuraba mal en Vercel, el valor incorrecto quedaba guardado en el bundle y había que forzar un rebuild entero para cambiarlo. Al final simplifiqué: si no hay variable de entorno, el cliente usa `/api/v1` como ruta relativa, que funciona directamente en Vercel sin configurar nada.

## Cómo usé IA durante el desarrollo

La usé bastante. Para código repetitivo que entendía pero que escribir a mano habría sido lento (los tipos de TypeScript, el cliente de API, los tests), fue útil. También para generar las recetas del JSON de ejemplo y para escribir la documentación.

Donde me fue menos bien fue en los bugs de integración. Cuando algo fallaba entre el frontend, el servidor y Vercel, darle solo el mensaje de error no servía de mucho. Necesitaba darle el stack trace completo, mostrarle qué devolvía la API exactamente y explicar qué había cambiado. Con ese contexto sí ayudaba a diagnosticar, pero la parte de entender qué estaba pasando la tuve que hacer yo.

Lo que me llevo: la IA es buena generando cosas, no tan buena depurando sistemas donde hay varias capas interactuando. Y si no entiendes lo que genera, tarde o temprano te lo encuentras como un bug que no sabes explicar.
