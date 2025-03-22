const pool = require('./db');

console.log('Checking ar_content table...');

pool.query('SELECT to_regclass(\'public.ar_content\')', (err, res) => {
  if (err) {
    console.error('Error checking ar_content table:', err);
    pool.end();
  } else {
    if (res.rows[0].to_regclass) {
      console.log('AR Content table exists');
      pool.end();
    } else {
      console.log('AR Content table does not exist. Creating it...');
      
      // Create ar_content table
      const createTableQuery = `
      CREATE TABLE ar_content (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id),
        marker_image_url VARCHAR(255),
        model_3d_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;
      
      pool.query(createTableQuery, (err) => {
        if (err) {
          console.error('Error creating ar_content table:', err);
        } else {
          console.log('AR Content table created successfully');
        }
        pool.end();
      });
    }
  }
}); 