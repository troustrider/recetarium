# Recetarium

Gestor de recetas personal. Centraliza tus recetas y genera listas de la compra unificadas.

Frontend en React + TypeScript + Vite + Tailwind CSS. Backend en Node.js + Express. Desplegado en Vercel.

Proyecto desarrollado por **Karim Abatouy Ábalos** para [Corner Estudios SL](https://corner-estudios.com).

**Demo en producción:** [recetarium-one.vercel.app](https://recetarium-one.vercel.app)

**API Docs (Swagger UI):** [Ver documentación interactiva](https://petstore.swagger.io/?url=https://raw.githubusercontent.com/troustrider/recetarium/main/docs/swagger.json)

**Tablero Kanban:** [Recetarium en Trello](https://trello.com/b/saQXnsUb/recetarium)

---

## Stack

**Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router

**Backend:** Node.js, Express, cors, dotenv, @neondatabase/serverless, Drizzle ORM

**Base de datos:** PostgreSQL en Neon (serverless)

## ORM tipado con Drizzle

El schema de la base de datos está definido en TypeScript con Drizzle ORM. Esto significa que los errores de columnas inexistentes o tipos incorrectos se detectan en tiempo de compilación, no en runtime.

Por ejemplo, si se renombra la columna `nombre` en la tabla `recetas`, el compilador avisa en todos los sitios donde se usa:

```ts
// El compilador detecta el error antes de que llegue a producción
await db.select({ nombre: recetas.nombre }).from(recetas)
```

Con SQL en strings planos ese mismo error pasaría el build y solo fallaría en producción. Drizzle aplica las ventajas del tipado fuerte de TypeScript a las queries SQL.

---

## Instalación y ejecución local

```bash
# 1. Clonar el repositorio
git clone https://github.com/troustrider/recetarium.git
cd recetarium

# 2. Instalar dependencias del frontend
npm install

# 3. Instalar dependencias del backend
cd server
npm install

# 4. Crear archivo de variables de entorno
echo "PORT=3001" > .env

# 5. Arrancar el backend (desde server/)
npm run dev

# 6. En otra terminal, arrancar el frontend (desde la raíz)
cd ..
npm run dev
```

Frontend en `http://localhost:5173`. Backend en `http://localhost:3001`.

---

## Estructura del proyecto

```
recetarium/
├── src/
│   ├── api/          # Cliente de API tipado
│   ├── components/   # Componentes reutilizables
│   ├── context/      # Context API (estado global)
│   ├── hooks/        # Custom hooks
│   ├── pages/        # Páginas (rutas)
│   ├── types/        # Interfaces y tipos TypeScript
│   └── utils/        # Funciones auxiliares
├── server/
│   └── src/
│       ├── config/       # Variables de entorno
│       ├── controllers/  # Validación y orquestación HTTP
│       ├── lib/          # Clientes de BD (Neon, Drizzle, schema)
│       ├── routes/       # Mapeo verbos HTTP → controladores
│       └── services/     # Lógica de negocio pura
└── docs/             # Documentación del proyecto
```
