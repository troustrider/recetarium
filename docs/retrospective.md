# Retrospectiva

## Qué aprendí conectando frontend, backend y API

React no es "la app", es solo la capa visual. Hasta esta fase no lo tenía del todo claro porque mis proyectos anteriores vivían en localStorage: frontend y datos en el mismo sitio, sin servidor. Conectar a un backend real lo hizo evidente: lo que muestra la UI es temporal, lo que persiste está en la API.

Ahora sé distinguir si el bug está en el cliente (estado, renders, tipos) o en la red (CORS, status codes, formato del body). Antes no sabía ni por dónde empezar a buscar.

Con TypeScript entendí por qué vale la pena definir los tipos en un solo sitio. Si `Receta` es el mismo tipo en el cliente API y en el formulario, TypeScript te avisa cuando uno se desactualiza.

## Principales problemas encontrados

**Conflicto ESM/CJS en Vercel.** El problema que más tiempo me costó. El `package.json` raíz tiene `"type": "module"` (ESM), pero el servidor usa `require()` (CJS). Cuando intenté que `api/index.js` hiciera de puente con sintaxis CJS, Node lanzó un error de `module is not defined`. La solución fue escribir ese archivo en ESM y dejar el servidor con su propio `package.json` marcado como CJS.

**Filesystem de solo lectura en producción.** En Vercel no puedes escribir en el filesystem. Las escrituras en el JSON fallaban silenciosamente, así que `toggleFavorita` devolvía siempre el mismo valor y el botón de favoritos no respondía. Lo corregí haciendo el toggle en el estado del frontend directamente, sin esperar a que el servidor confirme el nuevo valor.

**La variable de entorno evaluada en build time.** `VITE_API_URL` se incrusta en el bundle cuando Vite compila, no cuando el usuario abre la app. Si la configuraba mal en Vercel, el valor incorrecto quedaba guardado en el bundle y había que forzar un rebuild entero para cambiarlo. Al final simplifiqué: si no hay variable de entorno, el cliente usa `/api/v1` como ruta relativa, que funciona directamente en Vercel sin configurar nada.

## Cómo usé IA durante el desarrollo

La usé bastante. Para código repetitivo que entendía pero que escribir a mano habría sido lento (los tipos de TypeScript, el cliente de API, los tests), fue útil. También para generar las recetas del JSON de ejemplo y para escribir la documentación.

En los bugs de integración me ayudó menos. Cuando algo fallaba entre el frontend, el servidor y Vercel, darle solo el mensaje de error no servía de mucho. Necesitaba darle el stack trace completo, mostrarle qué devolvía la API exactamente y explicar qué había cambiado. Con ese contexto sí ayudaba a diagnosticar, pero la parte de entender qué estaba pasando la tuve que hacer yo.

La IA genera bien. Depurar cuando el bug está repartido entre el frontend, el servidor y Vercel es otra historia. Y si no entiendes lo que te genera, tarde o temprano se convierte en un bug que no sabes ni explicar.
