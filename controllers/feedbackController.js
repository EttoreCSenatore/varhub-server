const pool = require('../db');

const submitFeedback = async (req, res) => {
  try {
    const { projectId, rating, comments } = req.body;
    const userId = req.user.userId; // from the JWT, never from the request body

    const score = Number(rating);
    if (!Number.isInteger(Number(projectId)) || !Number.isInteger(score) || score < 1 || score > 5) {
      return res.status(400).json({ message: 'projectId and a rating between 1 and 5 are required' });
    }
    const comment = typeof comments === 'string' ? comments.slice(0, 2000) : null;

    await pool.query(
      'INSERT INTO feedback (user_id, project_id, rating, comment) VALUES ($1, $2, $3, $4)',
      [userId, projectId, score, comment]
    );
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
