const pool = require('./db');

console.log('Checking analytics table...');

pool.query('SELECT to_regclass(\'public.analytics\')', (err, res) => {
  if (err) {
    console.error('Error checking analytics table:', err);
    pool.end();
  } else {
    if (res.rows[0].to_regclass) {
      console.log('Analytics table exists');
      pool.end();
    } else {
      console.log('Analytics table does not exist. Creating it...');
      
      // Create analytics table
      const createTableQuery = `
      CREATE TABLE analytics (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id),
        views INTEGER DEFAULT 0,
        clicks INTEGER DEFAULT 0,
        conversions INTEGER DEFAULT 0,
        date DATE DEFAULT CURRENT_DATE
      )`;
      
      pool.query(createTableQuery, (err) => {
        if (err) {
          console.error('Error creating analytics table:', err);
        } else {
          console.log('Analytics table created successfully');
        }
        pool.end();
      });
    }
  }
}); 