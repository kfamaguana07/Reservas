// Importa la aplicación Express configurada
const app = require('./app');

// Puerto en el que se ejecutará el servidor
const PORT = process.env.PORT || 3000;

// Inicia el servidor y escucha en el puerto definido
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
