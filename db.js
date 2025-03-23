const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false // Required for Neon PostgreSQL connection
  },
  // Optimized settings for serverless environment
  max: 10, // Maximum number of clients
  idleTimeoutMillis: 30000, // Connection idle timeout
  connectionTimeoutMillis: 5000, // Connection timeout
});  

// Database connection function (previously testConnection)
// Modified to return a promise and not catch errors internally
const connect = async () => {
  const client = await pool.connect();
  try {
    await client.query('SELECT NOW()');
    return true; // Return success value
  } finally {
    client.release();
  }
};

// Export both pool and connect function
module.exports = {
  pool,
  connect,
  query: (text, params) => pool.query(text, params)
};