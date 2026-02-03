const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// Ruta para registro
router.post('/register', register);

// Ruta para login
router.post('/login', login);

module.exports = router;
