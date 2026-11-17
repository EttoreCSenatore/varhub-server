const express = require('express');  
const { submitFeedback } = require('../controllers/feedbackController');  

const { requireAuth } = require('../middleware/auth');

const router = express.Router();  

router.post('/feedback', requireAuth, submitFeedback);  

module.exports = router;