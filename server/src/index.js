require('dotenv').config();

const app = require('./app');
const { initializeDatabase, pool } = require('./database');

const PORT = Number(process.env.PORT || 3001);
const STARTUP_RETRIES = Number(process.env.STARTUP_RETRIES || 10);
const STARTUP_RETRY_DELAY_MS = Number(process.env.STARTUP_RETRY_DELAY_MS || 3000);

function wait(delayInMs) {
  return new Promise(resolve => {
    setTimeout(resolve, delayInMs);
  });
}

async function initializeDatabaseWithRetry() {
  for (let attempt = 1; attempt <= STARTUP_RETRIES; attempt += 1) {
    try {
      await initializeDatabase();
      return;
    } catch (error) {
      if (attempt === STARTUP_RETRIES) {
        throw error;
      }

      console.error(
        `Falha ao conectar no MySQL (tentativa ${attempt}/${STARTUP_RETRIES}). Tentando novamente...`,
      );

      await wait(STARTUP_RETRY_DELAY_MS);
    }
  }
}

async function startServer() {
  await initializeDatabaseWithRetry();

  app.listen(PORT, () => {
    console.log(`API de autenticacao disponivel na porta ${PORT}.`);
  });
}

async function shutdownServer() {
  try {
    await pool.end();
  } finally {
    process.exit(0);
  }
}

process.on('SIGINT', shutdownServer);
process.on('SIGTERM', shutdownServer);

startServer().catch(error => {
  console.error('Nao foi possivel iniciar a API.', error);
  process.exit(1);
});
