import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

// Configuración básica para demostración
export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.05'],
    errors: ['rate<0.1'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const timestamp = Date.now() + Math.random() * 10000;
  const userData = {
    username: `demo_${timestamp}`,
    email: `demo_${timestamp}@test.com`,
    password: 'Test123!@#',
  };

  // Registro
  let registerRes = http.post(
    `${BASE_URL}/api/auth/register`,
    JSON.stringify(userData),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(registerRes, {
    'registro exitoso': (r) => r.status === 201,
  }) || errorRate.add(1);

  sleep(0.5);

  // Login
  let loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email: userData.email,
      password: userData.password,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  const loginCheck = check(loginRes, {
    'login exitoso': (r) => r.status === 200,
  });

  if (!loginCheck) {
    errorRate.add(1);
    return;
  }

  const token = loginRes.json('token');
  sleep(0.5);

  // Crear reserva
  const reservaData = {
    nombreCliente: `Cliente ${timestamp}`,
    fechaReserva: new Date(Date.now() + 86400000).toISOString(),
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
  }) || errorRate.add(1);

  sleep(1);
}
