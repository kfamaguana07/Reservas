const request = require('supertest');
const express = require('express');
const authRoutes = require('../../src/routes/auth');
const User = require('../../src/models/User');

// Crear app de prueba
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Controller', () => {
  
  describe('POST /api/auth/register', () => {
    it('debería registrar un nuevo usuario exitosamente', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('msg', 'Usuario creado');
      
      // Verificar que el usuario fue creado en la BD
      const user = await User.findOne({ email: 'test@example.com' });
      expect(user).toBeTruthy();
      expect(user.email).toBe('test@example.com');
    });

    it('no debería permitir registrar un usuario duplicado', async () => {
      // Crear usuario primero
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      // Intentar crear el mismo usuario de nuevo
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'Ya existe el usuario');
    });

    it('debería cifrar la contraseña del usuario', async () => {
      const plainPassword = 'password123';
      
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: plainPassword
        });

      const user = await User.findOne({ email: 'test@example.com' });
      
      // La contraseña guardada no debe ser igual a la original
      expect(user.password).not.toBe(plainPassword);
      // Debe ser un hash bcrypt (comienza con $2a$ o $2b$)
      expect(user.password).toMatch(/^\$2[ab]\$/);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Crear usuario de prueba antes de cada test de login
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
    });

    it('debería permitir login con credenciales correctas', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(typeof res.body.token).toBe('string');
    });

    it('debería rechazar login con email incorrecto', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'Credenciales inválidas');
    });

    it('debería rechazar login con contraseña incorrecta', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'Credenciales inválidas');
    });

    it('el token generado debe ser válido', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      const token = res.body.token;
      
      // Verificar que el token tiene formato JWT (3 partes separadas por puntos)
      const parts = token.split('.');
      expect(parts).toHaveLength(3);
    });
  });
});
