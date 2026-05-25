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

App web fullstack para centralizar recetas y generar listas de la compra. Frontend en React + TypeScript + Vite. Backend en Node.js + Express con PostgreSQL en Neon serverless.

| Despliegue | URL |
|------------|-----|
| Frontend | [recetarium-one.vercel.app](https://recetarium-one.vercel.app) |
| API Docs | [Swagger UI](https://petstore.swagger.io/?url=https://raw.githubusercontent.com/troustrider/recetarium/main/docs/swagger.json) |

---

## Características

- Gestión completa de recetas (crear, editar, eliminar)
- Generación de lista de la compra unificada desde varias recetas
- Base de datos PostgreSQL en Neon con Drizzle ORM
- API REST documentada con Swagger UI
- Schema de BD definido en TypeScript — los errores de tipo se detectan en compilación, no en runtime

---

## Tecnologías

| Frontend | Uso |
|----------|-----|
| React | UI declarativa con componentes |
| TypeScript | Tipado estático |
| Vite | Bundler y servidor de desarrollo |
| Tailwind CSS | Estilos utility-first |
| React Router | Navegación entre páginas |

| Backend | Uso |
|---------|-----|
| Node.js + Express | Servidor HTTP y API REST |
| @neondatabase/serverless | Driver de PostgreSQL compatible con entornos serverless |
| Drizzle ORM | Schema tipado y migraciones en TypeScript |

| Auxiliares | Uso |
|------------|-----|
| Neon | PostgreSQL serverless con branching |
| Vercel | Despliegue de frontend y backend |

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
└── docs/
```

---

## Descargar y ejecutar

```bash
git clone https://github.com/troustrider/recetarium.git
cd recetarium
npm install
cd server && npm install

# Crear .env en server/
echo "PORT=3001" > .env

# Arrancar backend (desde server/)
npm run dev

# En otra terminal, arrancar frontend (desde raíz)
cd .. && npm run dev
```

Frontend en `http://localhost:5173`. Backend en `http://localhost:3001`.

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
