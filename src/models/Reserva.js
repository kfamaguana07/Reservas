const mongoose = require('mongoose');

// Esquema para las reservas de salas
const reservaSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fecha: String,
  hora: String,
  sala: String
});

// Exporta el modelo Reserva
module.exports = mongoose.model('Reserva', reservaSchema);
