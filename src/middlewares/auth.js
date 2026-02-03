const jwt = require('jsonwebtoken');

// Middleware para verificar el token JWT
module.exports = (req, res, next) => {
  // Extrae el token del header
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Acceso denegado' });

  try {
    // Verifica el token y adjunta la información del usuario
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch {
    res.status(400).json({ error: 'Token inválido' });
  }
};
