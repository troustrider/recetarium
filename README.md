![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=TypeScript&logoColor=FFF)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

# 🍳 Recetarium
> Gestor de recetas personal con lista de la compra unificada

App web fullstack para centralizar recetas y generar listas de la compra. Frontend en React + TypeScript + Vite. Backend en Node.js + Express con PostgreSQL en Neon serverless. Instalable como PWA y utilizable sin cobertura mientras se cocina.

| Despliegue | URL |
|------------|-----|
| Frontend | [recetarium-one.vercel.app](https://recetarium-one.vercel.app) |
| API Docs | [Swagger UI](https://petstore.swagger.io/?url=https://raw.githubusercontent.com/troustrider/recetarium/main/docs/swagger.json) |

---

## Características

**Recetario**
- Catálogo con filtros por sabor, categoría, tiempo, sin gluten y disponibilidad en despensa
- Alta, edición y borrado lógico: una receta borrada se restaura con su mismo id
- Ficha nutricional por porción (macros, hierro, gluten y micronutrientes) calculada por el servidor desde los ingredientes
- Guarnición opcional en bloque propio, con su propia ficha, que solo suma cuando se pide
- Escalado de cantidades por comensales, también dentro del texto de los pasos

**Cocina y compra**
- Despensa con cantidades, unidades y caducidad estimada por ingrediente
- Lista de la compra unificada, que resta lo que ya hay en casa y desglosa cuánto va a cada plato
- Planificador semanal con drag & drop; marcar un plato como hecho gasta lo suyo de la despensa
- Deshacer para cualquier acción destructiva, rebobinando todos los estados implicados a la vez
- Modo cocina con temporizadores por paso, alarma sintetizada y pantalla siempre encendida
- Precio estimado a partir de una tabla de precios reales de supermercados neerlandeses

**Plataforma**
- Acceso por invitación con Neon Auth (Google): cada hogar tiene su despensa, su plan y su lista, sobre un catálogo común
- Estado compartido entre dispositivos, con revalidación periódica y aviso si un guardado falla
- PWA instalable, con service worker y funcionamiento sin cobertura
- Pantalla de administración con accesos, IPs nuevas e invitaciones
- API REST documentada con Swagger UI
- Base de datos PostgreSQL en Neon, con ramas para pruebas

---

## Tecnologías

| Frontend | Uso |
|----------|-----|
| React 19 | UI declarativa con componentes |
| TypeScript | Tipado estático |
| Vite 8 | Bundler y servidor de desarrollo |
| Tailwind CSS 4 | Estilos utility-first |
| React Router 7 | Navegación entre páginas |
| framer-motion | Animaciones del catálogo y las hojas inferiores |
| @dnd-kit | Drag & drop del planificador semanal |
| lucide-react | Iconografía |

| Backend | Uso |
|---------|-----|
| Node.js + Express 5 | Servidor HTTP y API REST |
| @neondatabase/serverless | Driver de PostgreSQL compatible con entornos serverless |
| @neondatabase/neon-js | Cliente de Neon Auth en el navegador |
| jose | Verificación de los JWT de sesión contra el JWKS de Neon Auth |
| swagger-jsdoc | Especificación OpenAPI generada desde las rutas |

| Auxiliares | Uso |
|------------|-----|
| Neon | PostgreSQL serverless con branching, y Neon Auth para el login |
| Vercel | Despliegue de frontend y backend |
| Vitest | Tests de web y de servidor, este último contra una rama real de Neon |
| ESLint | Linting con reglas de React Hooks |

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
│   ├── scripts/      # Mantenimiento: invitaciones, imágenes, auditoría del recetario
│   ├── src/
│   │   ├── config/       # Especificación Swagger
│   │   ├── controllers/  # Validación, permisos y orquestación HTTP
│   │   ├── lib/          # Cliente de BD, sesión, hogar y cálculo nutricional
│   │   ├── routes/       # Mapeo verbos HTTP → controladores
│   │   └── services/     # Lógica de negocio y acceso a datos
│   └── tests/        # Suite de servidor (rama de pruebas de Neon)
├── sql/              # Esquema y migraciones aplicadas
├── public/           # Service worker, manifests, iconos
└── docs/
```

---

## Descargar y ejecutar

```bash
git clone https://github.com/troustrider/recetarium.git
cd recetarium
npm install
cd server && npm install

# server/.env — conexión a la rama de Neon
cp .env.example .env

# Arrancar backend (desde server/)
npm run dev

# En otra terminal, arrancar frontend (desde raíz)
cd .. && npm run dev
```

Frontend en `http://localhost:5173`. Backend en `http://localhost:3001`.

Hacen falta en `server/.env`: `DATABASE_URL` y las credenciales del cliente OAuth de
Google (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`), con
`http://localhost:3001/api/v1/auth/google/callback` autorizado en Google Cloud. Sin fila
en `invitados` no se entra, aunque se tenga cuenta de Google:

```bash
node server/scripts/invitar.mjs tu@correo.com --propio --admin
```

## Comprobaciones

```bash
npm run lint
npm run test:web      # jsdom, sin red
npm run test:server   # contra la rama recetarium-test de Neon
```

---

## Desplegar en Vercel

### Frontend

1. Conectar el repositorio en Vercel
2. Framework preset: Vite
3. Build command: `npm run build`

### Backend

1. Añadir `DATABASE_URL` en Vercel → Settings → Environment Variables
2. El backend se despliega automáticamente como Serverless Function en cada push

---

*Desarrollado durante las prácticas en [Corner Estudios](https://www.corner-estudios.com) — Karim Abatouy — 2026*
