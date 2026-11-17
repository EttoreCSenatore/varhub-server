const { Pool } = require('pg');
require('dotenv').config();

const isLocal = ['localhost', '127.0.0.1', '::1'].includes(process.env.DB_HOST);
// TLS is on for remote hosts (Neon) and verified by default; DB_SSL=false disables it (local Docker).
const useSsl = process.env.DB_SSL ? process.env.DB_SSL !== 'false' : !isLocal;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: useSsl ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

const connect = async () => {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    return true;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  connect,
  query: (text, params) => pool.query(text, params),
  end: () => pool.end(),
};
