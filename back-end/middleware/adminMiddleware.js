/* Middleware simples de autenticação admin via header */
module.exports = (req, res, next) => {
  const senha = req.headers['x-admin-senha'];

  if (!senha || senha !== process.env.ADMIN_SENHA) {
    return res.status(401).json({ error: 'Acesso negado' });
  }

  next();
};