import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Métrica personalizada para tasa de errores
const errorRate = new Rate('errors');

// Configuración de la prueba de humo (Smoke Test)
// Verifica que el sistema funciona con carga mínima
export const options = {
  vus: 1, // 1 usuario virtual
  duration: '1m', // Duración de 1 minuto
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% de peticiones < 500ms
    http_req_failed: ['rate<0.01'], // Tasa de error < 1%
    errors: ['rate<0.1'], // Tasa de errores de negocio < 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Preparar datos de registro
  const timestamp = Date.now();
  const userData = {
    username: `testuser_${timestamp}`,
    email: `testuser_${timestamp}@test.com`,
    password: 'Test123!@#',
  };

  // 1. Registro de usuario
  let registerRes = http.post(
    `${BASE_URL}/api/auth/register`,
    JSON.stringify(userData),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  check(registerRes, {
    'registro exitoso': (r) => r.status === 201,
    'mensaje de usuario creado': (r) => r.json('msg') !== undefined,
  }) || errorRate.add(1);

  sleep(1);

  // 2. Login de usuario
  let loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email: userData.email,
      password: userData.password,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  const loginCheck = check(loginRes, {
    'login exitoso': (r) => r.status === 200,
    'se recibe token en login': (r) => r.json('token') !== undefined,
  });

  if (!loginCheck) {
    errorRate.add(1);
    return;
  }

  const token = loginRes.json('token');

  sleep(1);

  // 3. Crear reserva
  const reservaData = {
    nombreCliente: `Cliente ${timestamp}`,
    fechaReserva: new Date(Date.now() + 86400000).toISOString(), // Mañana
    numeroPersonas: Math.floor(Math.random() * 8) + 1,
    estadoReserva: 'pendiente',
  };

  let reservaRes = http.post(
    `${BASE_URL}/api/reservas`,
    JSON.stringify(reservaData),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  check(reservaRes, {
    'reserva creada': (r) => r.status === 201,
    'mensaje de confirmación': (r) => r.json('msg') !== undefined,
  }) || errorRate.add(1);

  sleep(2);
}
