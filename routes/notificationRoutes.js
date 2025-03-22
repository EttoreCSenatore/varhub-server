const express = require('express');  
const { sendNotification } = require('../controllers/notificationController');  

const router = express.Router();  

router.post('/send-notification', sendNotification);  

// Add a simple GET endpoint for testing
router.get('/test-notification', (req, res) => {
  res.status(200).json({ 
    message: 'Notification endpoint is working. Use POST to /api/notifications/send-notification to send actual notifications.',
    samplePayload: {
      token: "DEVICE_FCM_TOKEN_HERE",
      title: "Notification Title",
      body: "Notification Body"
    }
  });
});

module.exports = router;