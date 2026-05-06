# Retrospectiva

## Qué aprendí conectando frontend, backend y API

La parte más reveladora fue entender que React no es "la app" sino solo la capa visual. Hasta esta fase podía construir interfaces que funcionaban, pero los datos venían de localStorage y todo vivía en el navegador. Conectar eso a un servidor real cambió completamente cómo pienso en el flujo de datos: el estado del frontend es temporal, lo que importa es lo que devuelve la API.

Aprendí a distinguir cuándo un problema está en el cliente (estado, renders, tipos) y cuándo está en la red (CORS, status codes, body format). Antes confundía ambos niveles habitualmente.

En TypeScript entendí el valor de los tipos compartidos: tener `Receta` definido en un solo sitio y usarlo tanto en el cliente (`getRecetas(): Promise<Receta[]>`) como en la validación del formulario elimina una categoría entera de bugs silenciosos.

## Principales problemas encontrados

**Conflicto ESM/CJS en Vercel.** El problema más costoso en tiempo. El root `package.json` tiene `"type": "module"` (ESM), pero el servidor usa `require()` (CJS). Cuando intenté que `api/index.js` hiciera de puente con sintaxis CJS, Node lanzó `ReferenceError: module is not defined in ES module scope`. La solución fue escribir ese wrapper en ESM (`import`/`export default`) y dejar el servidor con su propio `package.json` marcado como CJS.

**Filesystem de solo lectura en producción.** Las escrituras en el JSON fallaban silenciosamente en Vercel, lo que hacía que `toggleFavorita` devolviera un 500 porque `writeData` lanzaba una excepción. El botón de favoritos no respondía en producción y el error se tragaba en un `catch`. La lección: las funciones serverless tienen un filesystem efímero; cualquier estado que necesite persistir tiene que ir a una base de datos externa.

**URL de la API baked en build time.** `VITE_API_URL` se evalúa en tiempo de build, no en runtime. Configurarla mal en Vercel significaba que el valor incorrecto quedaba incrustado en el bundle y había que forzar un rebuild completo para aplicar el cambio. La solución definitiva fue usar una URL relativa (`/api/v1`) como fallback, que funciona sin ninguna variable de entorno cuando frontend y backend comparten dominio.

## Cómo usé IA durante el desarrollo

Usé IA principalmente como par técnico para diagnosticar problemas concretos. En el bug ESM/CJS, por ejemplo, tenía el stack trace pero no el contexto sobre cómo Vercel evalúa el tipo de módulo según el `package.json` más cercano. La IA ayudó a conectar esos puntos.

Para código, la IA fue útil para generar datos de prueba (las 20 recetas del JSON) y para redactar documentación, pero el diseño de la arquitectura, la estructura de componentes y las decisiones de API las tomé yo directamente. El patrón que funcionó mejor fue: yo defino qué tiene que hacer, la IA sugiere cómo, yo evalúo y apruebo o corrijo.

Lo que no funcionó: pedirle a la IA que "arregle el bug" sin darle contexto suficiente. Los problemas de integración entre capas son difíciles de diagnosticar sin ver el stack trace completo y el flujo de la petición de extremo a extremo.
