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

// Connection test function
const testConnection = async () => {
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT NOW()');
      console.log('Database connection successful');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Database connection failed:', err);
    // Allow server to continue running even if DB connection fails  
  }
};

// Test connection on server start
testConnection();

module.exports = pool;