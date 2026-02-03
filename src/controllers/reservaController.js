const Reserva = require('../models/Reserva');

// Crear nueva reserva
exports.crearReserva = async (req, res) => {
  try {
    const reserva = new Reserva({ ...req.body, userId: req.user.id });
    await reserva.save();
    res.status(201).json({ msg: 'Reserva creada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
