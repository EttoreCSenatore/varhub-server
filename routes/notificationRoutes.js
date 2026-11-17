const express = require('express');
const { sendNotification } = require('../controllers/notificationController');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/send-notification', requireAdmin, sendNotification);

module.exports = router;
