const pool = require('./db');

console.log('Checking projects table...');

pool.query('SELECT to_regclass(\'public.projects\')', (err, res) => {
  if (err) {
    console.error('Error checking projects table:', err);
    pool.end();
  } else {
    if (res.rows[0].to_regclass) {
      console.log('Projects table exists');
      pool.end();
    } else {
      console.log('Projects table does not exist. Creating it...');
      
      // Create projects table
      const createTableQuery = `
      CREATE TABLE projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        user_id INTEGER REFERENCES users(id),
        ar_model_url VARCHAR(255),
        thumbnail_url VARCHAR(255),
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;
      
      pool.query(createTableQuery, (err) => {
        if (err) {
          console.error('Error creating projects table:', err);
        } else {
          console.log('Projects table created successfully');
        }
        pool.end();
      });
    }
  }
}); 