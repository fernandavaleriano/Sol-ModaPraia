const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const db = require('../db/database');

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/* ── POST /api/auth/google ── */
/* Recebe o token do Google, valida e retorna JWT próprio */
router.post('/google', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token não informado' });
  }

  try {
    /* Valida o token com o Google */
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    /* Busca ou cria usuário no banco */
    let user = db.getUserByGoogleId(googleId);

    if (!user) {
      user = db.createUser({ googleId, email, name, photo: picture });
      console.log(`✅ Novo usuário criado: ${email}`);
    } else {
      console.log(`👤 Login: ${email}`);
    }

    /* Gera JWT próprio */
    const jwtToken = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token: jwtToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        photo: user.photo,
        address: user.address
      }
    });

  } catch (err) {
    console.error('Erro ao validar token Google:', err.message);
    res.status(401).json({ error: 'Token inválido' });
  }
});

/* ── PUT /api/auth/address ── */
/* Salva endereço do usuário */
router.put('/address', require('../middleware/authMiddleware'), (req, res) => {
  const { address } = req.body;

  if (!address) {
    return res.status(400).json({ error: 'Endereço não informado' });
  }

  const updated = db.updateUserAddress(req.user.id, address);
  res.json({ success: true, address: updated.address });
});

/* ── GET /api/auth/me ── */
/* Retorna dados do usuário logado */
router.get('/me', require('../middleware/authMiddleware'), (req, res) => {
  const user = db.getUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.json(user);
});


/* ── POST /api/auth/google-token ── */
/* Recebe dados do perfil via access_token (fluxo alternativo) */
router.post('/google-token', async (req, res) => {
  const { googleId, email, name, photo } = req.body;

  if (!email) return res.status(400).json({ error: 'Dados insuficientes' });

  try {
    let user = db.getUserByGoogleId(googleId);
    if (!user) {
      user = db.createUser({ googleId, email, name, photo });
      console.log(`✅ Novo usuário criado: ${email}`);
    } else {
      console.log(`👤 Login: ${email}`);
    }

    const jwtToken = require('jsonwebtoken').sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token: jwtToken, user });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = router;