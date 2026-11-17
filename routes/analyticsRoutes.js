const express = require('express');
const { recordEvent, summary, getEngagementLogs } = require('../controllers/analyticsController');
const { optionalAuth, requireAdmin } = require('../middleware/auth');
const { eventLimiter } = require('../middleware/limits');

const router = express.Router();

router.post('/events', eventLimiter, optionalAuth, recordEvent);
router.get('/analytics/summary', requireAdmin, summary);
router.get('/analytics', requireAdmin, getEngagementLogs);

module.exports = router;
