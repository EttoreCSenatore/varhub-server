const db = require('../db');
const { HttpError, asyncHandler } = require('../lib/http');

// Anyone can leave feedback (a QR visitor should not need an account); a token only attaches the user.
const submitFeedback = asyncHandler(async (req, res) => {
  const projectId = Number(req.body.projectId);
  const rating = Number(req.body.rating);
  if (!Number.isInteger(projectId) || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new HttpError(400, 'projectId and a rating between 1 and 5 are required');
  }
  const comment = typeof req.body.comments === 'string' ? req.body.comments.trim().slice(0, 2000) : '';

  const project = await db.query("SELECT 1 FROM projects WHERE id = $1 AND status = 'published'", [projectId]);
  if (!project.rows.length) throw new HttpError(404, 'Project not found');

  const userId = req.user ? req.user.userId : null;
  await db.query('INSERT INTO feedback (user_id, project_id, rating, comment) VALUES ($1, $2, $3, $4)', [
    userId, projectId, rating, comment || null,
  ]);
  await db.query('INSERT INTO engagement_logs (user_id, action_type, project_id) VALUES ($1, $2, $3)', [
    userId, 'feedback_submitted', projectId,
  ]);
  res.status(201).json({ message: 'Feedback submitted successfully' });
});

// Public summary of a project's feedback. Never exposes who wrote it.
const projectFeedback = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) throw new HttpError(400, 'Invalid project id');
  const stats = await db.query('SELECT COUNT(*)::int AS count, COALESCE(ROUND(AVG(rating), 1), 0)::float AS average FROM feedback WHERE project_id = $1', [id]);
  const recent = await db.query(
    `SELECT rating, comment, created_at FROM feedback
     WHERE project_id = $1 AND comment IS NOT NULL ORDER BY created_at DESC LIMIT 10`,
    [id]
  );
  res.json({ ...stats.rows[0], recent: recent.rows });
});

module.exports = { submitFeedback, projectFeedback };
