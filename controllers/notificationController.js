const admin = require('../firebaseAdmin');  

const sendNotification = async (req, res) => {  
  try {  
    const { token, title, body } = req.body;
    if (!token || !title || !body) {
      return res.status(400).json({ message: 'token, title and body are required' });
    }  
    const message = {  
      notification: { title, body },  
      token,  
    };  

    await admin.messaging().send(message);  
    res.status(200).json({ message: 'Notification sent successfully' });
  } catch (error) {  
    console.error('Error sending notification:', error);  
    res.status(500).json({ message: 'Failed to send notification' });  
  }  
};  

module.exports = { sendNotification };