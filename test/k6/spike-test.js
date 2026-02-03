import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

// Configuración de prueba de picos (Spike Test)
// Evalúa comportamiento ante aumentos súbitos de carga
export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Carga normal
    { duration: '30s', target: 200 }, // Pico repentino
    { duration: '3m', target: 200 },  // Mantener pico
    { duration: '30s', target: 10 },  // Bajada rápida
    { duration: '1m', target: 10 },   // Recuperación
    { duration: '30s', target: 0 },   // Finalizar
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% de peticiones < 2s
    http_req_failed: ['rate<0.15'], // Tasa de error < 15%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const timestamp = Date.now() + Math.random() * 10000;
  const userData = {
    username: `spikeuser_${timestamp}`,
    email: `spikeuser_${timestamp}@test.com`,
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

  // Login inmediato
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

  // Crear reserva rápidamente
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

  sleep(0.5);
}
