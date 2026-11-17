const { HttpError, asyncHandler } = require('../lib/http');

const sendNotification = asyncHandler(async (req, res) => {
  const { token, title, body } = req.body;
  if (!token || !title || !body) throw new HttpError(400, 'token, title and body are required');
  const admin = require('../firebaseAdmin'); // loaded lazily: the API works without Firebase configured
  await admin.messaging().send({ notification: { title, body }, token });
  res.json({ message: 'Notification sent successfully' });
});

module.exports = { sendNotification };
