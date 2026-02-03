const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { crearReserva } = require('../controllers/reservaController');

// Ruta protegida para crear reserva
router.post('/', auth, crearReserva);

module.exports = router;
