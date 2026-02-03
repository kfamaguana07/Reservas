import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

// Configuración de prueba de carga (Load Test)
// Evalúa el comportamiento con carga normal/esperada
export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Incrementar a 10 usuarios en 2 min
    { duration: '5m', target: 10 }, // Mantener 10 usuarios por 5 min
    { duration: '2m', target: 20 }, // Incrementar a 20 usuarios en 2 min
    { duration: '5m', target: 20 }, // Mantener 20 usuarios por 5 min
    { duration: '2m', target: 0 },  // Reducir a 0 usuarios en 2 min
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'], // 95% de peticiones < 800ms
    http_req_failed: ['rate<0.05'], // Tasa de error < 5%
    errors: ['rate<0.1'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const timestamp = Date.now() + Math.random();
  const userData = {
    username: `loaduser_${timestamp}`,
    email: `loaduser_${timestamp}@test.com`,
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

  sleep(1);

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
  sleep(1);

  // Crear múltiples reservas
  for (let i = 0; i < 3; i++) {
    const reservaData = {
      nombreCliente: `Cliente ${timestamp}_${i}`,
      fechaReserva: new Date(Date.now() + (i + 1) * 86400000).toISOString(),
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

    sleep(2);
  }
}
