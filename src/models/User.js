const mongoose = require('mongoose');

// Definición del esquema del usuario
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true }, // Correo único
  password: { type: String, required: true } // Contraseña hasheada
});

// Exportación del modelo User
module.exports = mongoose.model('User', userSchema);
