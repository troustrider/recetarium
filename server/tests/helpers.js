import app from '../src/app.js'

export async function arrancarServidor() {
  const server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  const { port } = server.address()
  return {
    base: `http://127.0.0.1:${port}/api/v1`,
    cerrar: () => new Promise((resolve) => server.close(resolve)),
  }
}

export function api(base) {
  const conClave = (options = {}) => ({
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.APP_KEY ? { 'x-app-key': process.env.APP_KEY } : {}),
      ...options.headers,
    },
  })

  return {
    get: (ruta) => fetch(`${base}${ruta}`),
    post: (ruta, body) => fetch(`${base}${ruta}`, conClave({ method: 'POST', body: JSON.stringify(body) })),
    put: (ruta, body) => fetch(`${base}${ruta}`, conClave({ method: 'PUT', body: JSON.stringify(body) })),
    patch: (ruta) => fetch(`${base}${ruta}`, conClave({ method: 'PATCH' })),
    del: (ruta) => fetch(`${base}${ruta}`, conClave({ method: 'DELETE' })),
    crudo: (ruta, options) => fetch(`${base}${ruta}`, options),
  }
}

export function recetaValida(extra = {}) {
  return {
    nombre: 'Receta de prueba',
    categoria: 'pruebas',
    sabor: 'salado',
    tiempoPreparacion: 20,
    ingredientes: [{ nombre: 'arroz', cantidad: 200, unidad: 'g', familia: 'cereales' }],
    pasos: ['Cocer el arroz'],
    precioPorPorcion: 1.5,
    porciones: 2,
    ...extra,
  }
}
