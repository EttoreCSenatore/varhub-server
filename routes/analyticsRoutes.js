const express = require('express');  
const { getEngagementLogs } = require('../controllers/analyticsController');  

const { requireAuth } = require('../middleware/auth');

const router = express.Router();  

router.get('/analytics', requireAuth, getEngagementLogs);  

module.exports = router;  