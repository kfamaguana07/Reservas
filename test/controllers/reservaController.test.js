const request = require('supertest');
const express = require('express');
const authRoutes = require('../../src/routes/auth');
const reservaRoutes = require('../../src/routes/reserva');
const Reserva = require('../../src/models/Reserva');

// Crear app de prueba
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/reservas', reservaRoutes);

describe('Reserva Controller', () => {
  let authToken;
  let userId;

  beforeEach(async () => {
    // Registrar y autenticar un usuario antes de cada test
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    authToken = loginRes.body.token;
  });

  describe('POST /api/reservas', () => {
    it('debería crear una reserva exitosamente con token válido', async () => {
      const res = await request(app)
        .post('/api/reservas')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fecha: '2026-02-15',
          hora: '10:00',
          sala: 'Sala A'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('msg', 'Reserva creada');

      // Verificar que la reserva fue creada en la BD
      const reserva = await Reserva.findOne({ sala: 'Sala A' });
      expect(reserva).toBeTruthy();
      expect(reserva.fecha).toBe('2026-02-15');
      expect(reserva.hora).toBe('10:00');
      expect(reserva.sala).toBe('Sala A');
    });

    it('debería rechazar crear reserva sin token de autenticación', async () => {
      const res = await request(app)
        .post('/api/reservas')
        .send({
          fecha: '2026-02-15',
          hora: '10:00',
          sala: 'Sala A'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('debería rechazar crear reserva con token inválido', async () => {
      const res = await request(app)
        .post('/api/reservas')
        .set('Authorization', 'Bearer token-invalido')
        .send({
          fecha: '2026-02-15',
          hora: '10:00',
          sala: 'Sala A'
        });

      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty('error');
    });

    it('debería asociar la reserva al usuario autenticado', async () => {
      const res = await request(app)
        .post('/api/reservas')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fecha: '2026-02-15',
          hora: '10:00',
          sala: 'Sala A'
        });

      expect(res.statusCode).toBe(201);

      // Verificar que la reserva tiene el userId
      const reserva = await Reserva.findOne({ sala: 'Sala A' });
      expect(reserva.userId).toBeTruthy();
    });

    it('debería permitir crear múltiples reservas para el mismo usuario', async () => {
      // Primera reserva
      await request(app)
        .post('/api/reservas')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fecha: '2026-02-15',
          hora: '10:00',
          sala: 'Sala A'
        });

      // Segunda reserva
      const res = await request(app)
        .post('/api/reservas')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fecha: '2026-02-16',
          hora: '14:00',
          sala: 'Sala B'
        });

      expect(res.statusCode).toBe(201);

      // Verificar que hay 2 reservas en la BD
      const count = await Reserva.countDocuments();
      expect(count).toBe(2);
    });
  });
});
