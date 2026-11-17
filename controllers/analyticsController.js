const db = require('../db');
const { HttpError, asyncHandler } = require('../lib/http');

// Actions the public events endpoint accepts. 'feedback_submitted' is only written by the feedback endpoint.
const PUBLIC_ACTIONS = ['project_view', 'qr_scan', 'ar_launch', 'video_play', 'share'];

const recordEvent = asyncHandler(async (req, res) => {
  const { action } = req.body;
  const projectId = req.body.projectId == null ? null : Number(req.body.projectId);
  if (!PUBLIC_ACTIONS.includes(action)) throw new HttpError(400, `action must be one of ${PUBLIC_ACTIONS.join(', ')}`);
  if (projectId !== null && (!Number.isInteger(projectId) || projectId < 1)) throw new HttpError(400, 'Invalid projectId');

  if (projectId !== null) {
    const project = await db.query('SELECT 1 FROM projects WHERE id = $1', [projectId]);
    if (!project.rows.length) throw new HttpError(404, 'Project not found');
  }
  await db.query('INSERT INTO engagement_logs (user_id, action_type, project_id) VALUES ($1, $2, $3)', [
    req.user ? req.user.userId : null, action, projectId,
  ]);
  res.status(202).json({ message: 'Recorded' });
});

// Aggregated engagement for the admin dashboard.
const summary = asyncHandler(async (req, res) => {
  const totals = await db.query(`
    SELECT (SELECT COUNT(*) FROM users)::int AS users,
           (SELECT COUNT(*) FROM projects WHERE status = 'published')::int AS projects,
           (SELECT COUNT(*) FROM feedback)::int AS feedback,
           (SELECT COALESCE(ROUND(AVG(rating), 1), 0) FROM feedback)::float AS avg_rating,
           (SELECT COUNT(*) FROM engagement_logs WHERE action_type = 'qr_scan')::int AS qr_scans,
           (SELECT COUNT(*) FROM engagement_logs WHERE action_type = 'ar_launch')::int AS ar_launches`);
  const projects = await db.query(`
    SELECT p.id, p.name AS title, p.status,
           COUNT(*) FILTER (WHERE e.action_type = 'project_view')::int AS views,
           COUNT(*) FILTER (WHERE e.action_type = 'qr_scan')::int AS qr_scans,
           COUNT(*) FILTER (WHERE e.action_type = 'ar_launch')::int AS ar_launches,
           COUNT(*) FILTER (WHERE e.action_type = 'video_play')::int AS video_plays,
           (SELECT COUNT(*) FROM feedback f WHERE f.project_id = p.id)::int AS feedback_count,
           (SELECT COALESCE(ROUND(AVG(rating), 1), 0) FROM feedback f WHERE f.project_id = p.id)::float AS avg_rating
    FROM projects p LEFT JOIN engagement_logs e ON e.project_id = p.id
    GROUP BY p.id ORDER BY views DESC, p.id`);
  const daily = await db.query(`
    SELECT to_char(d::date, 'YYYY-MM-DD') AS date, COUNT(e.id)::int AS events
    FROM generate_series(CURRENT_DATE - 13, CURRENT_DATE, '1 day') d
    LEFT JOIN engagement_logs e ON e.created_at::date = d::date
    GROUP BY d ORDER BY d`);
  res.json({ totals: totals.rows[0], projects: projects.rows, daily: daily.rows });
});

// Raw log, newest first (capped).
const getEngagementLogs = asyncHandler(async (req, res) => {
  const { rows } = await db.query('SELECT * FROM engagement_logs ORDER BY created_at DESC LIMIT 500');
  res.json(rows);
});

module.exports = { recordEvent, summary, getEngagementLogs };
