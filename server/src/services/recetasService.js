const fs = require('fs/promises')
const path = require('path')

const DATA_PATH = path.join(__dirname, '../data/recetas.json')

async function readData() {
  const content = await fs.readFile(DATA_PATH, 'utf-8')
  return JSON.parse(content)
}

async function writeData(data) {
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2))
}

async function getAll({ categoria, sabor } = {}) {
  let recetas = await readData()
  if (categoria) recetas = recetas.filter((r) => r.categoria === categoria)
  if (sabor) recetas = recetas.filter((r) => r.sabor === sabor)
  return recetas
}

async function getById(id) {
  const recetas = await readData()
  return recetas.find((r) => r.id === id) ?? null
}

async function create(data) {
  const recetas = await readData()
  const nueva = { id: crypto.randomUUID(), favorita: false, ...data }
  recetas.push(nueva)
  await writeData(recetas)
  return nueva
}

async function update(id, data) {
  const recetas = await readData()
  const index = recetas.findIndex((r) => r.id === id)
  if (index === -1) return null
  recetas[index] = { ...recetas[index], ...data, id }
  await writeData(recetas)
  return recetas[index]
}

async function toggleFavorita(id) {
  const recetas = await readData()
  const index = recetas.findIndex((r) => r.id === id)
  if (index === -1) return null
  recetas[index].favorita = !recetas[index].favorita
  await writeData(recetas)
  return recetas[index]
}

async function remove(id) {
  const recetas = await readData()
  const index = recetas.findIndex((r) => r.id === id)
  if (index === -1) return false
  recetas.splice(index, 1)
  await writeData(recetas)
  return true
}

module.exports = { getAll, getById, create, update, toggleFavorita, remove }
