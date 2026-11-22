const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const db = require('./db');
const { authLimiter } = require('./middleware/limits');
const { version } = require('./package.json');

const app = express();
app.set('trust proxy', 1); // behind Railway's proxy

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,https://varhub-client.vercel.app')
  .split(',').map((o) => o.trim()).filter(Boolean);

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    // No Origin header: curl, server-to-server, same-origin requests.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
}));
app.use(express.json({ limit: '100kb' }));

app.get('/', (req, res) => {
  res.json({
    service: 'VARHub API',
    version,
    endpoints: ['/api/auth', '/api/projects', '/api/feedback', '/api/events', '/api/analytics', '/api/notifications'],
    health: '/health',
  });
});

// Public and cheap: for uptime monitors and for the web footer.
app.get('/api/version', (req, res) => res.json({ version }));

app.get('/health', async (req, res) => {
  const database = await db.connect().then(() => 'connected').catch(() => 'disconnected');
  res.status(database === 'connected' ? 200 : 503).json({
    status: database === 'connected' ? 'healthy' : 'degraded',
    version,
    uptime: Math.floor(process.uptime()),
    database,
  });
});

app.use('/api/auth', authLimiter, require('./routes/authRoutes'));
app.use('/api', require('./routes/projectRoutes'));
app.use('/api', require('./routes/feedbackRoutes'));
app.use('/api', require('./routes/analyticsRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

app.use((req, res) => res.status(404).json({ message: `Not found: ${req.originalUrl}` }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON' });
  if (err.type === 'entity.too.large') return res.status(413).json({ message: 'Request body too large' });
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ success: false, message: err.expose ? err.message : 'An unexpected error occurred' });
});

module.exports = app;
