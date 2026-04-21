const fs = require('fs');
const path = require('path');
const defaultProducts = require('./defaultProducts');

const DB_FILE = path.join(__dirname, 'data.json');

function buildDefaultProduct(product, index) {
  return {
    id: `${Date.now()}${index}`,
    nome: product.nome,
    preco: product.preco,
    categoria: product.categoria,
    descricao: product.descricao || '',
    tamanhos: product.tamanhos || ['P', 'M', 'G', 'GG'],
    fotos: product.fotos || [],
    ativo: product.ativo !== false,
    createdAt: new Date().toISOString()
  };
}

function hydrateDefaultProducts() {
  return defaultProducts.map((product, index) => buildDefaultProduct(product, index));
}

function loadData() {
  if (!fs.existsSync(DB_FILE)) {
    const initial = { users: [], orders: [], products: hydrateDefaultProducts() };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));

  // Garante que todas as coleções existam
  let needsSave = false;
  if (!data.products) { data.products = []; needsSave = true; }
  if (!data.users) { data.users = []; needsSave = true; }
  if (!data.orders) { data.orders = []; needsSave = true; }

  if (Array.isArray(data.products) && data.products.length === 0 && defaultProducts.length > 0) {
    data.products = hydrateDefaultProducts();
    needsSave = true;
  }

  // Salva se adicionou campos faltando
  if (needsSave) {
    saveData(data);
  }

  return data;
}

function saveData(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

/* ── USERS ── */
function getUserByGoogleId(googleId) {
  return loadData().users.find(u => u.googleId === googleId) || null;
}

function getUserById(id) {
  return loadData().users.find(u => u.id === id) || null;
}

function createUser({ googleId, email, name, photo }) {
  const data = loadData();
  const user = {
    id: Date.now().toString(),
    googleId, email, name,
    photo: photo || null,
    address: null,
    createdAt: new Date().toISOString()
  };
  data.users.push(user);
  saveData(data);
  return user;
}

function updateUserAddress(id, address) {
  const data = loadData();
  const user = data.users.find(u => u.id === id);
  if (!user) return null;
  user.address = address;
  saveData(data);
  return user;
}

/* ── ORDERS ── */
function createOrder({ userId, items, total, status, paymentMethod, customerInfo }) {
  const data = loadData();
  const order = {
    id: Date.now().toString(),
    userId,
    items,
    total,
    status,
    paymentMethod: paymentMethod || 'nao_definido',
    customerInfo: customerInfo || null,
    createdAt: new Date().toISOString()
  };
  data.orders.push(order);
  saveData(data);
  return order;
}

function getOrdersByUser(userId) {
  return loadData().orders.filter(o => o.userId === userId);
}

function getAllOrders() {
  return loadData().orders;
}

/* ── ADMIN ── */
function getAllUsers() {
  return loadData().users.map(u => ({
    id: u.id, name: u.name, email: u.email,
    photo: u.photo, address: u.address, createdAt: u.createdAt
  }));
}

function updateOrderStatus(orderId, status) {
  const data = loadData();
  const order = data.orders.find(o => o.id === orderId);
  if (!order) return null;
  order.status = status;
  saveData(data);
  return order;
}

function getStats() {
  const data = loadData();
  const totalReceita = data.orders.reduce((sum, o) => {
    // Aceita tanto string "R$ 199,90" quanto número
    let val = 0;
    if (typeof o.total === 'string') {
      val = parseFloat(o.total.replace('R$', '').replace(/\./g, '').replace(',', '.').trim());
    } else if (typeof o.total === 'number') {
      val = o.total;
    }
    return sum + (isNaN(val) ? 0 : val);
  }, 0);
  return {
    totalPedidos: data.orders.length,
    totalClientes: data.users.length,
    totalReceita,
    pendentes: data.orders.filter(o => o.status === 'pendente').length
  };
}

/* ── PRODUCTS ── */
function getAllProducts() {
  return loadData().products;
}

function getProductById(id) {
  return loadData().products.find(p => p.id === id) || null;
}

function createProduct({ nome, preco, categoria, descricao, tamanhos, fotos }) {
  const data = loadData();
  const product = {
    id: Date.now().toString(),
    nome,
    preco,
    categoria,
    descricao: descricao || '',
    tamanhos: tamanhos || ['P', 'M', 'G', 'GG'],
    fotos: fotos || [],
    ativo: true,
    createdAt: new Date().toISOString()
  };
  data.products.push(product);
  saveData(data);
  return product;
}

function updateProduct(id, fields) {
  const data = loadData();
  const product = data.products.find(p => p.id === id);
  if (!product) return null;
  Object.assign(product, fields);
  saveData(data);
  return product;
}

function deleteProduct(id) {
  const data = loadData();
  const idx = data.products.findIndex(p => p.id === id);
  if (idx === -1) return false;
  data.products.splice(idx, 1);
  saveData(data);
  return true;
}

/* ── ÚNICO module.exports ── */
module.exports = {
  getUserByGoogleId, getUserById, createUser, updateUserAddress,
  createOrder, getOrdersByUser, getAllOrders,
  getAllUsers, updateOrderStatus, getStats,
  getAllProducts, getProductById, createProduct, updateProduct, deleteProduct
};
