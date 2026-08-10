import * as sesionesService from '../services/sesionesService.js'

function entero(valor, porDefecto, maximo) {
  const n = Number.parseInt(valor, 10)
  if (!Number.isFinite(n) || n < 1) return porDefecto
  return Math.min(n, maximo)
}

export async function getSesiones(req, res) {
  const limite = entero(req.query.limite, 100, 500)
  const dias = entero(req.query.dias, 7, 90)
  const [sesiones, resumen, nuevas] = await Promise.all([
    sesionesService.listarSesiones(limite),
    sesionesService.resumenPorUsuario(),
    sesionesService.ipsNuevas(dias),
  ])
  res.json({ sesiones, resumen, ipsNuevas: nuevas, dias })
}
