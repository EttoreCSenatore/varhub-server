const express = require('express');
const { submitFeedback } = require('../controllers/feedbackController');
const { optionalAuth } = require('../middleware/auth');
const { feedbackLimiter } = require('../middleware/limits');

const router = express.Router();

router.post('/feedback', feedbackLimiter, optionalAuth, submitFeedback);

module.exports = router;
