const pool = require('../db');  

const getEngagementLogs = async (req, res) => {  
  try {  
    const logs = await pool.query('SELECT * FROM engagement_logs');  
    res.status(200).json(logs.rows);  
  } catch (error) {  
    console.error(error);  
    res.status(500).json({ message: 'Server error' });  
  }  
};  

module.exports = { getEngagementLogs };  