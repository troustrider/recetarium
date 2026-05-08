# Recetarium

Gestor de recetas personal. Centraliza tus recetas y genera listas de la compra unificadas.

Frontend en React + TypeScript + Vite + Tailwind CSS. Backend en Node.js + Express. Desplegado en Vercel.

Proyecto de fin de estudios desarrollado por **Karim Abatouy Ábalos** para [Corner Estudios SL](https://cornerestudios.com).

**Demo en producción:** [recetarium-one.vercel.app](https://recetarium-one.vercel.app)

**Tablero Kanban:** [Recetarium en Trello](https://trello.com/b/saQXnsUb/recetarium)

---

## Stack

**Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router

**Backend:** Node.js, Express, cors, dotenv

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
│       ├── routes/       # Mapeo verbos HTTP → controladores
│       └── services/     # Lógica de negocio pura
└── docs/             # Documentación del proyecto
```
