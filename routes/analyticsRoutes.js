const express = require('express');  
const { getEngagementLogs } = require('../controllers/analyticsController');  

const router = express.Router();  

router.get('/analytics', getEngagementLogs);  

module.exports = router;  