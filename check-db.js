const pool = require('./db');

console.log('Trying to connect to database...');

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected successfully:', res.rows[0]);
    
    // Check if users table exists
    pool.query('SELECT to_regclass(\'public.users\')', (err, res) => {
      if (err) {
        console.error('Error checking users table:', err);
      } else {
        if (res.rows[0].to_regclass) {
          console.log('Users table exists');
        } else {
          console.log('Users table does not exist. Creating it...');
          
          // Create users table
          const createTableQuery = `
          CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255),
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )`;
          
          pool.query(createTableQuery, (err) => {
            if (err) {
              console.error('Error creating users table:', err);
            } else {
              console.log('Users table created successfully');
            }
            pool.end();
          });
        }
      }
    });
  }
}); 