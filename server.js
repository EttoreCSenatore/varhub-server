const express = require('express');  
const cors = require('cors');  
const authRoutes = require('./routes/authRoutes');  
const projectRoutes = require('./routes/projectRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');  
const notificationRoutes = require('./routes/notificationRoutes');  
require('dotenv').config();

const app = express();  

app.use(cors());  
app.use(express.json());  

// Routes  
app.use('/api/auth', authRoutes);  
app.use('/api', projectRoutes);
app.use('/api', feedbackRoutes);  
app.use('/api', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);

const PORT = process.env.PORT || 5000;  
app.listen(PORT, '0.0.0.0', () => {  
  console.log(`Server running on port ${PORT}`);  
}); 