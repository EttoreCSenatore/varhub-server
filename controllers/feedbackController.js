const pool = require('../db');  

const submitFeedback = async (req, res) => {  
    try {  
      const { userId, projectId, rating, comments } = req.body;  
      await pool.query(  
        'INSERT INTO feedback (user_id, project_id, rating, comments) VALUES ($1, $2, $3, $4)',  
        [userId, projectId, rating, comments]  
      );  
      // Log the feedback action  
      await pool.query(  
        'INSERT INTO engagement_logs (user_id, action_type, project_id) VALUES ($1, $2, $3)',  
        [userId, 'feedback_submitted', projectId]  
      );  
      res.status(201).json({ message: 'Feedback submitted successfully' });  
    } catch (error) {  
      console.error(error);  
      res.status(500).json({ message: 'Server error' });  
    }  
  };

module.exports = { submitFeedback };