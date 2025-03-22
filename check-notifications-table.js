const pool = require('./db');

console.log('Checking notifications table...');

pool.query('SELECT to_regclass(\'public.notifications\')', (err, res) => {
  if (err) {
    console.error('Error checking notifications table:', err);
    pool.end();
  } else {
    if (res.rows[0].to_regclass) {
      console.log('Notifications table exists');
      pool.end();
    } else {
      console.log('Notifications table does not exist. Creating it...');
      
      // Create notifications table
      const createTableQuery = `
      CREATE TABLE notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        title VARCHAR(255) NOT NULL,
        message TEXT,
        read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;
      
      pool.query(createTableQuery, (err) => {
        if (err) {
          console.error('Error creating notifications table:', err);
        } else {
          console.log('Notifications table created successfully');
        }
        pool.end();
      });
    }
  }
}); 