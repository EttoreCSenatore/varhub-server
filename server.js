const express = require('express');  
const cors = require('cors');  
const authRoutes = require('./routes/authRoutes');  
const projectRoutes = require('./routes/projectRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');  
const notificationRoutes = require('./routes/notificationRoutes');  
const db = require('./db'); // Import the entire db module
require('dotenv').config();

const app = express();  

// Simplified CORS configuration 
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Log CORS configuration
console.log('CORS enabled with origin: *');

app.use(express.json());  

// Root path handler
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'VARhub API',
    version: '1.0.0',
    description: 'API server for VARhub XR content platform',
    endpoints: {
      auth: '/api/auth',
      projects: '/api/projects',
      feedback: '/api/feedback',
      analytics: '/api/analytics',
      notifications: '/api/notifications'
    },
    documentation: '/api-docs',
    health: '/health'
  });
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection status
    const dbStatus = await db.connect().then(() => 'connected').catch(() => 'disconnected');
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(process.uptime())} seconds`,
      environment: process.env.NODE_ENV || 'development',
      database: dbStatus
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Routes  
app.use('/api/auth', authRoutes);  
app.use('/api', projectRoutes);
app.use('/api', feedbackRoutes);  
app.use('/api', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `The requested resource at ${req.originalUrl} was not found`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(`Error: ${err.message}`);
  
  res.status(err.status || 500).json({
    error: err.name || 'InternalServerError',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Start server first, then try to connect to database
const PORT = process.env.PORT || 5000;  
app.listen(PORT, '0.0.0.0', () => {  
  console.log(`Server running on port ${PORT}`);
  
  // Try to connect to database after server has started
  db.connect()
    .then(() => {
      console.log('Database connected successfully');
    })
    .catch(err => {
      console.error('Failed to connect to database:', err.message);
      console.log('Server will continue running without database connection');
      // Don't exit process, allow server to run even without DB
    });
}); 