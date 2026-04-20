require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const ordersRoutes = require('./routes/orders');
const adminRoutes  = require('./routes/admin');
const paymentsRoutes = require('./routes/payments');

const app = express();

function normalizeOrigin(value) {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch (_error) {
    return null;
  }
}

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.PUBLIC_SITE_URL,
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:5501',
  'http://127.0.0.1:5501',
  'http://localhost:5502',
  'http://127.0.0.1:5502'
]
  .map(normalizeOrigin)
  .filter(Boolean);

/* ── Middlewares ── */
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origem não permitida pelo CORS'));
  },
  credentials: true
}));
app.use(express.json());

/* ── Rotas ── */
app.use('/api/auth', authRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/admin',  adminRoutes);
app.use('/api/payments', paymentsRoutes);

/* ── Rota de teste ── */
app.get('/', (req, res) => {
  res.json({ status: 'Sol Moda Praia API rodando ☀️' });
});

/* ── Inicia servidor ── */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n☀️  Servidor rodando em http://localhost:${PORT}\n`);
});
