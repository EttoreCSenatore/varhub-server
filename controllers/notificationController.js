const admin = require('../firebaseAdmin');  

const sendNotification = async (req, res) => {  
  try {  
    const { token, title, body } = req.body;  
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