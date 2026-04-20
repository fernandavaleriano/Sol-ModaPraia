const express = require('express');
const db = require('../db/database');
const adminAuth = require('../middleware/adminMiddleware');

const router = express.Router();

/* Todas as rotas admin exigem a senha */
router.use(adminAuth);

/* ── GET /api/admin/stats ── */
router.get('/stats', (req, res) => {
  res.json(db.getStats());
});

/* ── GET /api/admin/orders ── */
router.get('/orders', (req, res) => {
  const orders = db.getAllOrders();
  const users = db.getAllUsers();

  const enriched = orders.map(order => {
    const user = users.find(u => u.id === order.userId);
    return {
      ...order,
      cliente: order.customerInfo || (user
        ? { name: user.name, email: user.email, address: user.address }
        : { name: 'Desconhecido', email: '-', address: '-' })
    };
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json(enriched);
});

/* ── GET /api/admin/users ── */
router.get('/users', (req, res) => {
  res.json(db.getAllUsers());
});

/* ── PATCH /api/admin/orders/:id/status ── */
router.patch('/orders/:id/status', (req, res) => {
  const { status } = req.body;
  const valid = ['pendente', 'confirmado', 'enviado', 'entregue', 'cancelado'];

  if (!valid.includes(status)) {
    return res.status(400).json({ error: 'Status inválido' });
  }

  const updated = db.updateOrderStatus(req.params.id, status);
  if (!updated) return res.status(404).json({ error: 'Pedido não encontrado' });

  res.json(updated);
});

/* ══════════════════════════════════════════
   PRODUTOS
══════════════════════════════════════════ */

/* ── GET /api/admin/products ── */
router.get('/products', (req, res) => {
  res.json(db.getAllProducts());
});

/* ── GET /api/admin/products/:id ── */
router.get('/products/:id', (req, res) => {
  const product = db.getProductById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
  res.json(product);
});

/* ── POST /api/admin/products ── */
router.post('/products', (req, res) => {
  const { nome, preco, categoria, descricao, tamanhos, fotos } = req.body;

  if (!nome || !preco || !categoria) {
    return res.status(400).json({ error: 'nome, preco e categoria são obrigatórios' });
  }

  const product = db.createProduct({ nome, preco, categoria, descricao, tamanhos, fotos });
  res.status(201).json(product);
});

/* ── PUT /api/admin/products/:id ── */
router.put('/products/:id', (req, res) => {
  const { nome, preco, categoria, descricao, tamanhos, fotos, ativo } = req.body;

  const updated = db.updateProduct(req.params.id, {
    ...(nome !== undefined && { nome }),
    ...(preco !== undefined && { preco }),
    ...(categoria !== undefined && { categoria }),
    ...(descricao !== undefined && { descricao }),
    ...(tamanhos !== undefined && { tamanhos }),
    ...(fotos !== undefined && { fotos }),
    ...(ativo !== undefined && { ativo })
  });

  if (!updated) return res.status(404).json({ error: 'Produto não encontrado' });
  res.json(updated);
});

/* ── DELETE /api/admin/products/:id ── */
router.delete('/products/:id', (req, res) => {
  const deleted = db.deleteProduct(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Produto não encontrado' });
  res.json({ success: true });
});

module.exports = router;