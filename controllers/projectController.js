const db = require('../db');
const { HttpError, asyncHandler, isHttpUrl } = require('../lib/http');

const TYPES = ['model', 'video360', 'webxr', 'link'];
const STATUSES = ['draft', 'published', 'archived'];

// One normalized shape for the client (title, model_url, ...), regardless of how rows were stored.
const SELECT = `
  SELECT p.id, p.name AS title, p.description, p.type, p.status, p.thumbnail_url,
         COALESCE(a.model_3d_url, p.ar_model_url) AS model_url, p.ios_model_url, p.video_url, p.page_url,
         p.created_at, COALESCE(f.avg_rating, 0)::float AS avg_rating, COALESCE(f.feedback_count, 0)::int AS feedback_count
  FROM projects p
  LEFT JOIN LATERAL (SELECT model_3d_url FROM ar_content WHERE project_id = p.id ORDER BY id LIMIT 1) a ON true
  LEFT JOIN (SELECT project_id, ROUND(AVG(rating), 1) AS avg_rating, COUNT(*) AS feedback_count
             FROM feedback GROUP BY project_id) f ON f.project_id = p.id`;

const parseId = (value) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new HttpError(400, 'Invalid project id');
  return id;
};

const listProjects = asyncHandler(async (req, res) => {
  const where = ["p.status = 'published'"];
  const params = [];
  if (req.query.type) {
    if (!TYPES.includes(req.query.type)) throw new HttpError(400, 'Unknown project type');
    params.push(req.query.type);
    where.push(`p.type = $${params.length}`);
  }
  if (req.query.q) {
    params.push(`%${String(req.query.q).slice(0, 100).replace(/[%_\\]/g, '\\$&')}%`);
    where.push(`(p.name ILIKE $${params.length} OR p.description ILIKE $${params.length})`);
  }
  const { rows } = await db.query(`${SELECT} WHERE ${where.join(' AND ')} ORDER BY p.created_at DESC, p.id DESC LIMIT 100`, params);
  res.json(rows);
});

const getProject = asyncHandler(async (req, res) => {
  const { rows } = await db.query(`${SELECT} WHERE p.id = $1 AND p.status = 'published'`, [parseId(req.params.id)]);
  if (!rows[0]) throw new HttpError(404, 'Project not found');
  res.json(rows[0]);
});

// ---- admin ----

const readProject = (body, { partial }) => {
  const out = {};
  const text = (key, max) => {
    if (body[key] === undefined) return;
    const value = body[key] === null ? null : String(body[key]).trim();
    if (value && value.length > max) throw new HttpError(400, `${key} is too long`);
    out[key] = value || null;
  };
  const url = (key) => {
    text(key, 500);
    if (out[key] && !isHttpUrl(out[key])) throw new HttpError(400, `${key} must be an http(s) URL`);
  };

  text('title', 255);
  text('description', 5000);
  ['thumbnail_url', 'model_url', 'ios_model_url', 'video_url', 'page_url'].forEach(url);
  if (body.type !== undefined) {
    if (!TYPES.includes(body.type)) throw new HttpError(400, `type must be one of ${TYPES.join(', ')}`);
    out.type = body.type;
  }
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) throw new HttpError(400, `status must be one of ${STATUSES.join(', ')}`);
    out.status = body.status;
  }
  if (!partial && !out.title) throw new HttpError(400, 'title is required');
  return out;
};

const COLUMNS = {
  title: 'name', description: 'description', type: 'type', status: 'status', thumbnail_url: 'thumbnail_url',
  model_url: 'ar_model_url', ios_model_url: 'ios_model_url', video_url: 'video_url', page_url: 'page_url',
};

const createProject = asyncHandler(async (req, res) => {
  const data = readProject(req.body, { partial: false });
  const keys = Object.keys(data);
  const { rows } = await db.query(
    `INSERT INTO projects (${keys.map((k) => COLUMNS[k]).join(', ')}, user_id)
     VALUES (${keys.map((_, i) => `$${i + 1}`).join(', ')}, $${keys.length + 1}) RETURNING id`,
    [...keys.map((k) => data[k]), req.user.userId]
  );
  const created = await db.query(`${SELECT} WHERE p.id = $1`, [rows[0].id]);
  res.status(201).json(created.rows[0]);
});

const updateProject = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const data = readProject(req.body, { partial: true });
  const keys = Object.keys(data);
  if (!keys.length) throw new HttpError(400, 'Nothing to update');
  const { rowCount } = await db.query(
    `UPDATE projects SET ${keys.map((k, i) => `${COLUMNS[k]} = $${i + 1}`).join(', ')}, updated_at = NOW() WHERE id = $${keys.length + 1}`,
    [...keys.map((k) => data[k]), id]
  );
  if (!rowCount) throw new HttpError(404, 'Project not found');
  const updated = await db.query(`${SELECT} WHERE p.id = $1`, [id]);
  res.json(updated.rows[0]);
});

// Every project, including drafts and archived ones.
const listAllProjects = asyncHandler(async (req, res) => {
  const { rows } = await db.query(`${SELECT} ORDER BY p.created_at DESC, p.id DESC LIMIT 500`);
  res.json(rows);
});

module.exports = { listProjects, getProject, createProject, updateProject, listAllProjects };
