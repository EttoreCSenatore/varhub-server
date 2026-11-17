require('dotenv').config();
const app = require('./app');
const db = require('./db');

if (process.env.NODE_ENV === 'production' && !(process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 16)) {
  console.error('JWT_SECRET must be set (16+ characters) in production');
  process.exit(1);
}

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`VARHub API listening on port ${PORT}`);
  // The API starts even if the database is down; /health reports it.
  db.connect()
    .then(() => console.log('Database connected'))
    .catch((err) => console.error('Database unavailable:', err.message));
});

const shutdown = () => server.close(() => db.end().finally(() => process.exit(0)));
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
