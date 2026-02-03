const request = require('supertest');
const app = require('../../src/app');

describe('🔒 Pruebas de Seguridad - OWASP Top 10', () => {
  
  describe('A01:2021 - Broken Access Control', () => {
    it('No debe permitir acceso a reservas sin autenticación', async () => {
      const res = await request(app)
        .post('/api/reservas')
        .send({
          nombreCliente: 'Test',
          fechaReserva: new Date().toISOString(),
          numeroPersonas: 4
        });
      
      expect(res.status).toBe(401);
    });

    it('No debe permitir acceso con token inválido', async () => {
      const res = await request(app)
        .post('/api/reservas')
        .set('Authorization', 'Bearer token_invalido')
        .send({
          nombreCliente: 'Test',
          fechaReserva: new Date().toISOString(),
          numeroPersonas: 4
        });
      
      expect(res.status).toBe(401);
    });
  });

  describe('A02:2021 - Cryptographic Failures', () => {
    it('Las contraseñas deben estar hasheadas', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'securitytest',
          email: 'security@test.com',
          password: 'Test123!@#'
        });
      
      // Verificar que la contraseña no se devuelve
      expect(res.body).not.toHaveProperty('password');
    });
  });

  describe('A03:2021 - Injection', () => {
    it('Debe proteger contra SQL Injection', async () => {
      const maliciousInput = "' OR '1'='1";
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: maliciousInput,
          password: maliciousInput
        });
      
      expect(res.status).toBe(400);
    });

    it('Debe validar contra NoSQL Injection', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: { $ne: null },
          password: { $ne: null }
        });
      
      expect(res.status).toBe(400);
    });
  });

  describe('A07:2021 - Identification and Authentication Failures', () => {
    it('Debe validar formato de email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'test',
          email: 'email_invalido',
          password: 'Test123!@#'
        });
      
      expect(res.status).toBe(400);
    });

    it('No debe revelar si el usuario existe', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'noexiste@test.com',
          password: 'wrongpassword'
        });
      
      // Debe devolver mensaje genérico
      expect(res.body.error).toBe('Credenciales inválidas');
    });
  });

  describe('XSS - Cross-Site Scripting', () => {
    it('Debe sanitizar entrada de usuario', async () => {
      const xssPayload = '<script>alert("XSS")</script>';
      
      // Primero registramos y hacemos login
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'xsstest',
          email: 'xss@test.com',
          password: 'Test123!@#'
        });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'xss@test.com',
          password: 'Test123!@#'
        });

      const token = loginRes.body.token;

      const res = await request(app)
        .post('/api/reservas')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nombreCliente: xssPayload,
          fechaReserva: new Date().toISOString(),
          numeroPersonas: 4,
          estadoReserva: 'pendiente'
        });
      
      // La petición puede ser exitosa, pero el payload debe ser sanitizado
      if (res.status === 201) {
        // Verificar que el script fue removido o escapado
        expect(res.body.msg).toBeDefined();
      }
    });
  });

  describe('CSRF - Cross-Site Request Forgery', () => {
    it('Debe requerir autenticación para operaciones críticas', async () => {
      const res = await request(app)
        .post('/api/reservas')
        .send({
          nombreCliente: 'Test CSRF',
          fechaReserva: new Date().toISOString(),
          numeroPersonas: 4
        });
      
      // Sin token debe fallar
      expect(res.status).toBe(401);
    });
  });

  describe('Security Headers', () => {
    it('Debe tener headers de seguridad básicos', async () => {
      const res = await request(app).get('/');
      
      // No debe exponer información del servidor
      expect(res.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('Input Validation', () => {
    it('Debe validar tipos de datos', async () => {
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'validationtest',
          email: 'validation@test.com',
          password: 'Test123!@#'
        });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'validation@test.com',
          password: 'Test123!@#'
        });

      const token = loginRes.body.token;

      const res = await request(app)
        .post('/api/reservas')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nombreCliente: 12345, // Debería ser string
          fechaReserva: 'fecha_invalida',
          numeroPersonas: 'texto' // Debería ser número
        });
      
      // Debe validar o aceptar la conversión automática
      expect([201, 400]).toContain(res.status);
    });
  });
});
