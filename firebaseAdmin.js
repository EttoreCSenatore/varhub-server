const admin = require('firebase-admin');  

let serviceAccount;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Parse JSON from environment variable
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // Use local file for development environment
    serviceAccount = require('./serviceAccountKey.json');
  }

  admin.initializeApp({  
    credential: admin.credential.cert(serviceAccount),  
  });  
} catch (error) {
  console.error('Firebase initialization error:', error);
}

module.exports = admin;