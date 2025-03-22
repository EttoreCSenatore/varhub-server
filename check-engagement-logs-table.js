const pool = require('./db');

console.log('Checking engagement_logs table...');

pool.query('SELECT to_regclass(\'public.engagement_logs\')', (err, res) => {
  if (err) {
    console.error('Error checking engagement_logs table:', err);
    pool.end();
  } else {
    if (res.rows[0].to_regclass) {
      console.log('Engagement Logs table exists');
      pool.end();
    } else {
      console.log('Engagement Logs table does not exist. Creating it...');
      
      // Create engagement_logs table
      const createTableQuery = `
      CREATE TABLE engagement_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        project_id INTEGER REFERENCES projects(id),
        action_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;
      
      pool.query(createTableQuery, (err) => {
        if (err) {
          console.error('Error creating engagement_logs table:', err);
        } else {
          console.log('Engagement Logs table created successfully');
        }
        pool.end();
      });
    }
  }
}); 