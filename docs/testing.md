# Testing

## Tests automáticos

Stack: **Vitest** + **React Testing Library** + **jsdom**.

```
npm test            # watch mode
npm run test:coverage  # cobertura en html
```

### Archivos de test

| Archivo | Qué cubre |
|---|---|
| `src/tests/RecetaCard.test.tsx` | Componente visual de tarjeta |
| `src/tests/useFiltros.test.ts` | Hook de filtrado de recetas |

### RecetaCard (6 tests)

- Renderiza el nombre en el heading
- Renderiza el tiempo de preparación
- Llama a `onClick` al pulsar la tarjeta
- Llama a `onToggleFavorita` sin propagar el click al artículo (stopPropagation)
- Muestra `aria-label="Quitar de favoritas"` cuando `favorita: true`
- Muestra la categoría si existe

### useFiltros (5 tests)

- Sin filtros devuelve todas las recetas
- Filtro por sabor devuelve solo las recetas del sabor elegido
- Filtro por categoría devuelve solo las recetas de esa categoría
- Filtro por tiempoMax excluye las recetas más lentas
- `resetFiltros` restaura el catálogo completo

---

## Pruebas manuales

Fui probando cada cosa en el navegador según la iba desarrollando, con el frontend y el backend corriendo en local.

**CRUD de recetas.** Crear, editar y borrar funciona. El formulario no deja guardar si falta el nombre, algún ingrediente o algún paso. Al guardar, va directo al detalle de la receta. Todo persiste al recargar la página.

**Catálogo y filtros.** Los filtros de categoría se generan solos a partir de las recetas que hay. El de sabor cubre los cinco tipos. Se pueden usar los dos filtros a la vez.

**Favoritas.** Las tarjetas se ven igual que en el catálogo, con imágenes incluidas.

**Planificador.** Se pueden poner varias recetas el mismo día. Los botones +/− de raciones funcionan por receta (1 a 4). Se puede arrastrar una receta de un día a otro.

**Despensa.** Se añaden ingredientes con su categoría. Clic cambia entre "lleno" y "poco". Hay un botón para importar todo desde la lista de la compra.

**Lista de la compra.** Los ingredientes de distintas recetas se juntan sumando cantidades. Las raciones multiplican bien.

**Modo oscuro.** El toggle funciona y recuerda la preferencia. Si no hay preferencia guardada, usa la del sistema.

**Estados de carga y error.** Probado cortando el servidor. Aparece el mensaje de error y el botón de reintentar funciona al levantarlo de nuevo.

## Responsive

Probado en móvil, tablet y escritorio. El catálogo pasa de una columna a dos. La navegación colapsa en móvil.

## Bugs encontrados y corregidos

- **Favoritas sin imágenes.** La página tenía sus propias tarjetas con gradientes en lugar de usar `RecetaCard`. Se reemplazó.
- **Raciones cortadas.** Al sincronizar el planificador con la lista de la compra, las raciones se limitaban a 4 aunque la suma de varios días fuera mayor. Se quitó el límite.
- **Toggle de favorita no revertía.** En producción (Vercel) el filesystem es de solo lectura, así que cada llamada a `PATCH /favorita` leía siempre `favorita: false` del JSON original y devolvía `true`. Se corrigió con optimistic update en el frontend.
