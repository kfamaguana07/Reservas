import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

// Configuración de prueba de estrés (Stress Test)
// Encuentra los límites del sistema
export const options = {
  stages: [
    { duration: '2m', target: 20 },  // Calentamiento a 20 usuarios
    { duration: '3m', target: 50 },  // Incremento a 50 usuarios
    { duration: '3m', target: 100 }, // Incremento a 100 usuarios
    { duration: '3m', target: 150 }, // Incremento a 150 usuarios
    { duration: '3m', target: 200 }, // Incremento a 200 usuarios (estrés)
    { duration: '2m', target: 0 },   // Enfriamiento
  ],
  thresholds: {
    http_req_duration: ['p(95)<1500'], // 95% de peticiones < 1.5s
    http_req_failed: ['rate<0.1'], // Tasa de error < 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const timestamp = Date.now() + Math.random() * 10000;
  const userData = {
    username: `stressuser_${timestamp}`,
    email: `stressuser_${timestamp}@test.com`,
    password: 'Test123!@#',
  };

  // Registro
  let registerRes = http.post(
    `${BASE_URL}/api/auth/register`,
    JSON.stringify(userData),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  check(registerRes, {
    'registro OK': (r) => r.status === 201,
  }) || errorRate.add(1);

  sleep(0.5);

  // Login
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
    'login OK': (r) => r.status === 200,
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
    'reserva OK': (r) => r.status === 201,
  }) || errorRate.add(1);

  sleep(1);
}
