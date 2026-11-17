const bcrypt = require('bcryptjs');
const db = require('../db');
const { signToken } = require('../middleware/auth');
const { HttpError, asyncHandler } = require('../lib/http');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const publicUser = (u) => ({ id: u.id, email: u.email, name: u.name, role: u.role });
// Compared against when the email is unknown, so response time does not reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);

const signup = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const name = String(req.body.name || '').trim();
  const password = String(req.body.password || '');

  if (!email || !password || !name) throw new HttpError(400, 'Please provide name, email and password');
  if (name.length > 100) throw new HttpError(400, 'Name is too long');
  if (!EMAIL_RE.test(email) || email.length > 255) throw new HttpError(400, 'Please provide a valid email address');
  if (password.length < 8 || password.length > 128) throw new HttpError(400, 'Password must be 8 to 128 characters long');

  const existing = await db.query('SELECT 1 FROM users WHERE email = $1', [email]);
  if (existing.rows.length) throw new HttpError(409, 'An account with this email already exists');

  const hash = await bcrypt.hash(password, 12);
  const { rows } = await db.query(
    'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, role',
    [email, hash, name]
  );
  res.status(201).json({ success: true, token: await signToken(rows[0]), user: publicUser(rows[0]) });
});

const login = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!email || !password) throw new HttpError(400, 'Please provide both email and password');

  const { rows } = await db.query('SELECT id, email, name, role, password_hash FROM users WHERE email = $1', [email]);
  const ok = await bcrypt.compare(password, rows[0] ? rows[0].password_hash : DUMMY_HASH);
  if (!rows[0] || !ok) throw new HttpError(401, 'Invalid email or password');

  res.json({ success: true, token: await signToken(rows[0]), user: publicUser(rows[0]) });
});

// Current user from a valid token (used by the client to restore a session).
const me = asyncHandler(async (req, res) => {
  const { rows } = await db.query('SELECT id, email, name, role FROM users WHERE id = $1', [req.user.userId]);
  if (!rows[0]) throw new HttpError(401, 'Account no longer exists');
  res.json({ user: publicUser(rows[0]) });
});

module.exports = { signup, login, me };
