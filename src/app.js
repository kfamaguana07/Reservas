// Carga las variables de entorno desde .env
require('dotenv').config();

// Importa los módulos necesarios
const express = require('express');
const mongoose = require('mongoose');

// Crea una instancia de Express
const app = express();

// Middleware para parsear cuerpos en formato JSON
app.use(express.json());

// Conexión a la base de datos MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error al conectar MongoDB', err));

// Rutas para autenticación y reservas/turnos
app.use('/api/auth', require('./routes/auth'));
app.use('/api/reservas', require('./routes/reserva'));

// Exporta la app configurada
module.exports = app;
