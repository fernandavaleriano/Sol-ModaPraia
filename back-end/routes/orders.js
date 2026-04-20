const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

function parseOptionalUser(req, _res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch (_err) {
    req.user = null;
  }

  next();
}

/* ── POST /api/orders ── */
router.post('/', parseOptionalUser, (req, res) => {
  const { items, total, paymentMethod, customerName, customerEmail, customerAddress } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Carrinho vazio' });
  }

  // Se tiver token de autenticação, usa o usuário logado
  // Se não, cria um usuário temporário com os dados fornecidos
  let userId = req.user ? req.user.id : null;

  const order = db.createOrder({
    userId: userId || 'guest',
    items,
    total,
    status: 'pendente',
    paymentMethod: paymentMethod || 'nao_definido',
    customerInfo: {
      name: customerName || (req.user ? req.user.name : 'Não informado'),
      email: customerEmail || (req.user ? req.user.email : 'Não informado'),
      address: customerAddress || 'Não informado'
    }
  });

  console.log(`🛒 Novo pedido #${order.id} — ${total} — Pagamento: ${paymentMethod || 'nao_definido'}`);
  res.status(201).json(order);
});

/* ── GET /api/orders/my ── */
router.get('/my', authMiddleware, (req, res) => {
  const orders = db.getOrdersByUser(req.user.id);
  res.json(orders);
});

/* ── GET /api/orders (admin) ── */
router.get('/', authMiddleware, (req, res) => {
  const all = db.getAllOrders();
  res.json(all);
});

module.exports = router;
