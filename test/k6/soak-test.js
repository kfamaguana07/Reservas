import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

// Configuración de prueba de resistencia (Soak Test)
// Evalúa estabilidad durante períodos prolongados
export const options = {
  stages: [
    { duration: '5m', target: 30 },  // Incremento gradual
    { duration: '2h', target: 30 },  // Mantener carga constante por 2 horas
    { duration: '5m', target: 0 },   // Reducir gradualmente
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% de peticiones < 1s
    http_req_failed: ['rate<0.05'], // Tasa de error < 5%
    errors: ['rate<0.1'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const timestamp = Date.now() + Math.random() * 10000;
  const userData = {
    username: `soakuser_${timestamp}`,
    email: `soakuser_${timestamp}@test.com`,
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

  sleep(2);

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
  sleep(2);

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

  sleep(3);
}
