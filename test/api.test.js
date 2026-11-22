// Integration tests: real Express app + real PostgreSQL (DB_NAME defaults to varhub_test).
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-test-secret-test-secret';
process.env.DB_NAME = process.env.TEST_DB_NAME || 'varhub_test';
process.env.DB_SSL = process.env.DB_SSL || 'false';

const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { migrate } = require('../scripts/migrate');
const db = require('../db');
const app = require('../app');

let server;
let base;

const call = async (method, path, { body, token } = {}) => {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body && method !== 'GET' ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
};

const register = async (email, name = 'Test User') => (await call('POST', '/api/auth/register', { body: { email, name, password: 'a-good-password' } })).body;
const makeAdmin = async (email) => {
  await db.query("UPDATE users SET role = 'admin' WHERE email = $1", [email]);
  return (await call('POST', '/api/auth/login', { body: { email, password: 'a-good-password' } })).body.token;
};
const addProject = async (title, status = 'published', type = 'model') =>
  (await db.query('INSERT INTO projects (name, status, type) VALUES ($1, $2, $3) RETURNING id', [title, status, type])).rows[0].id;

before(async () => {
  await migrate();
  await new Promise((resolve) => { server = app.listen(0, resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await db.end();
});
beforeEach(() => db.query('TRUNCATE engagement_logs, feedback, notifications, analytics, ar_content, projects, users RESTART IDENTITY CASCADE'));

test('health reports the database', async () => {
  const { status, body } = await call('GET', '/health');
  assert.equal(status, 200);
  assert.equal(body.database, 'connected');
});

test('register validates input and rejects duplicates', async () => {
  assert.equal((await call('POST', '/api/auth/register', { body: { email: 'x', name: 'n', password: 'a-good-password' } })).status, 400);
  assert.equal((await call('POST', '/api/auth/register', { body: { email: 'a@b.co', name: 'n', password: 'short' } })).status, 400);
  const ok = await call('POST', '/api/auth/register', { body: { email: 'A@B.co', name: 'Ana', password: 'a-good-password' } });
  assert.equal(ok.status, 201);
  assert.equal(ok.body.user.role, 'visitor');
  assert.equal(ok.body.user.email, 'a@b.co'); // normalized
  assert.equal((await call('POST', '/api/auth/register', { body: { email: 'a@b.co', name: 'Ana', password: 'a-good-password' } })).status, 409);
});

test('login, wrong password and /me', async () => {
  await register('a@b.co');
  assert.equal((await call('POST', '/api/auth/login', { body: { email: 'a@b.co', password: 'wrong-password' } })).status, 401);
  assert.equal((await call('POST', '/api/auth/login', { body: { email: 'nobody@b.co', password: 'a-good-password' } })).status, 401);
  const { body } = await call('POST', '/api/auth/login', { body: { email: 'a@b.co', password: 'a-good-password' } });
  const me = await call('GET', '/api/auth/me', { token: body.token });
  assert.equal(me.status, 200);
  assert.equal(me.body.user.email, 'a@b.co');
  assert.equal((await call('GET', '/api/auth/me')).status, 401);
  assert.equal((await call('GET', '/api/auth/me', { token: 'garbage' })).status, 401);
});

test('projects: public list shows only published, filters and 404/400', async () => {
  const id = await addProject('Visible');
  await addProject('Hidden draft', 'draft');
  await addProject('A video', 'published', 'video360');

  const all = await call('GET', '/api/projects');
  assert.deepEqual(all.body.map((p) => p.title).sort(), ['A video', 'Visible']);
  assert.equal((await call('GET', '/api/projects?type=video360')).body.length, 1);
  assert.equal((await call('GET', '/api/projects?q=vis')).body.length, 1);
  assert.equal((await call('GET', '/api/projects?type=nope')).status, 400);
  assert.equal((await call('GET', `/api/projects/${id}`)).body.title, 'Visible');
  assert.equal((await call('GET', '/api/projects/9999')).status, 404);
  assert.equal((await call('GET', '/api/projects/abc')).status, 400);
});

test('feedback works anonymously, validates, and the summary hides authors', async () => {
  const id = await addProject('P');
  assert.equal((await call('POST', '/api/feedback', { body: { projectId: id, rating: 9 } })).status, 400);
  assert.equal((await call('POST', '/api/feedback', { body: { projectId: 9999, rating: 5 } })).status, 404);
  assert.equal((await call('POST', '/api/feedback', { body: { projectId: id, rating: 4, comments: 'Great demo' } })).status, 201);
  const { token } = await register('a@b.co');
  assert.equal((await call('POST', '/api/feedback', { token, body: { projectId: id, rating: 2 } })).status, 201);

  const summary = (await call('GET', `/api/projects/${id}/feedback`)).body;
  assert.equal(summary.count, 2);
  assert.equal(summary.average, 3);
  assert.deepEqual(Object.keys(summary.recent[0]).sort(), ['comment', 'created_at', 'rating']);
  const rows = (await db.query('SELECT user_id FROM feedback ORDER BY id')).rows;
  assert.equal(rows[0].user_id, null);
  assert.equal(rows[1].user_id, 1);
});

test('events accept only whitelisted actions', async () => {
  const id = await addProject('P');
  assert.equal((await call('POST', '/api/events', { body: { action: 'qr_scan', projectId: id } })).status, 202);
  assert.equal((await call('POST', '/api/events', { body: { action: 'feedback_submitted', projectId: id } })).status, 400);
  assert.equal((await call('POST', '/api/events', { body: { action: 'qr_scan', projectId: 9999 } })).status, 404);
});

test('admin routes: 401 without token, 403 for visitors, 200 for admins', async () => {
  const { token } = await register('a@b.co');
  for (const [method, path] of [['GET', '/api/analytics/summary'], ['GET', '/api/analytics'], ['GET', '/api/admin/projects'], ['POST', '/api/projects'], ['POST', '/api/notifications/send-notification']]) {
    assert.equal((await call(method, path)).status, 401, `${method} ${path} without token`);
    assert.equal((await call(method, path, { token, body: {} })).status, 403, `${method} ${path} as visitor`);
  }
  const adminToken = await makeAdmin('a@b.co');
  assert.equal((await call('GET', '/api/analytics/summary', { token: adminToken })).status, 200);
});

test('admin can create, update and unpublish projects; URLs must be http(s)', async () => {
  await register('a@b.co');
  const token = await makeAdmin('a@b.co');

  assert.equal((await call('POST', '/api/projects', { token, body: { title: '' } })).status, 400);
  assert.equal((await call('POST', '/api/projects', { token, body: { title: 'X', page_url: 'javascript:alert(1)' } })).status, 400);
  assert.equal((await call('POST', '/api/projects', { token, body: { title: 'X', type: 'bogus' } })).status, 400);

  const created = await call('POST', '/api/projects', { token, body: { title: 'New', type: 'link', page_url: 'https://example.com', status: 'published' } });
  assert.equal(created.status, 201);
  assert.equal(created.body.title, 'New');
  assert.equal((await call('GET', '/api/projects')).body.length, 1);

  const updated = await call('PUT', `/api/projects/${created.body.id}`, { token, body: { status: 'archived' } });
  assert.equal(updated.body.status, 'archived');
  assert.equal((await call('GET', '/api/projects')).body.length, 0);
  assert.equal((await call('GET', '/api/admin/projects', { token })).body.length, 1);
  assert.equal((await call('PUT', '/api/projects/9999', { token, body: { title: 'x' } })).status, 404);
});

test('analytics summary aggregates events and feedback', async () => {
  const id = await addProject('P');
  await register('a@b.co');
  const token = await makeAdmin('a@b.co');
  await call('POST', '/api/events', { body: { action: 'qr_scan', projectId: id } });
  await call('POST', '/api/events', { body: { action: 'project_view', projectId: id } });
  await call('POST', '/api/feedback', { body: { projectId: id, rating: 5 } });

  const { body } = await call('GET', '/api/analytics/summary', { token });
  assert.equal(body.totals.qr_scans, 1);
  assert.equal(body.totals.feedback, 1);
  assert.equal(body.projects[0].views, 1);
  assert.equal(body.projects[0].avg_rating, 5);
  assert.equal(body.daily.length, 14);
});

test('malformed JSON gets a 400, unknown routes a 404', async () => {
  const res = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad' });
  assert.equal(res.status, 400);
  assert.equal((await call('GET', '/nope')).status, 404);
});

test('GET /api/version reports the package version', async () => {
  const { status, body } = await call('GET', '/api/version');
  assert.equal(status, 200);
  assert.equal(body.version, require('../package.json').version);
});

test('demo reset refuses to run without DEMO_MODE and, in demo mode, rebuilds a believable demo', async () => {
  const { demoReset } = require('../scripts/demo-reset');
  const options = { adminEmail: 'demo@varhub.example', adminPassword: 'demo-password-123' };
  delete process.env.DEMO_MODE;
  await register('keep@b.co');
  await assert.rejects(() => demoReset(options), /DEMO_MODE=1/);
  assert.equal((await db.query('SELECT COUNT(*)::int AS n FROM users')).rows[0].n, 1); // nothing was deleted

  process.env.DEMO_MODE = '1';
  try {
    await demoReset(options);
  } finally {
    delete process.env.DEMO_MODE;
  }
  assert.equal((await db.query("SELECT COUNT(*)::int AS n FROM users WHERE email = 'keep@b.co'")).rows[0].n, 0);
  assert.equal((await db.query("SELECT role FROM users WHERE email = 'demo@varhub.example'")).rows[0].role, 'admin');
  assert.ok((await db.query('SELECT COUNT(*)::int AS n FROM engagement_logs')).rows[0].n > 100);
  const login = await call('POST', '/api/auth/login', { body: { email: 'demo@varhub.example', password: 'demo-password-123' } });
  assert.equal(login.status, 200);
});

test('releases.yaml is valid and its top entry matches package.json', () => {
  const { loadReleases, validate } = require('../scripts/release-notes');
  const releases = loadReleases();
  assert.deepEqual(validate(releases), []);
  assert.equal(String(releases[0].version), require('../package.json').version);
});
