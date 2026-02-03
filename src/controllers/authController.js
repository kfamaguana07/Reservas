const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Registro de nuevo usuario
exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verifica si el usuario ya existe
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Ya existe el usuario' });

    // Cifra la contraseña
    const hash = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hash });
    await user.save();

    res.status(201).json({ msg: 'Usuario creado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Inicio de sesión
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Busca al usuario
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Credenciales inválidas' });

    // Compara la contraseña
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Credenciales inválidas' });

    // Genera token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
