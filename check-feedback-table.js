const pool = require('./db');

console.log('Checking feedback table...');

pool.query('SELECT to_regclass(\'public.feedback\')', (err, res) => {
  if (err) {
    console.error('Error checking feedback table:', err);
    pool.end();
  } else {
    if (res.rows[0].to_regclass) {
      console.log('Feedback table exists');
      pool.end();
    } else {
      console.log('Feedback table does not exist. Creating it...');
      
      // Create feedback table
      const createTableQuery = `
      CREATE TABLE feedback (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id),
        user_id INTEGER REFERENCES users(id),
        rating INTEGER,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;
      
      pool.query(createTableQuery, (err) => {
        if (err) {
          console.error('Error creating feedback table:', err);
        } else {
          console.log('Feedback table created successfully');
        }
        pool.end();
      });
    }
  }
}); 