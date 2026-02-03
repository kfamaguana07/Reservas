const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

// Configurar antes de todos los tests
beforeAll(async () => {
  // Crear servidor MongoDB en memoria
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Conectar mongoose a la base de datos en memoria
  await mongoose.connect(mongoUri);
  
  // Configurar variable de entorno para JWT
  process.env.JWT_SECRET = 'test-secret-key-123';
});

// Limpiar después de cada test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Cerrar conexión después de todos los tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
