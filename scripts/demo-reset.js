// Resets a PUBLIC DEMO database: wipes users, feedback and events, reseeds the sample projects, creates a demo
// admin and simulates a few weeks of visitor activity so the dashboard looks alive.
// DANGER: deletes data. It refuses to run unless DEMO_MODE=1 is set explicitly. Never set it on a real installation.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { migrate, seed } = require('./migrate');

const DAYS = 42;

// Small deterministic generator, so a reset always produces the same demo.
const rng = (() => {
  let s = 20260101;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
})();
const pick = (items) => items[Math.floor(rng() * items.length)];

const COMMENTS = [
  'Loved seeing it in my room.', 'Very smooth on my phone.', 'The AR button was easy to find.',
  'Would like more models like this.', 'Great for the open house.', 'Took a moment to load, then worked well.',
];

async function demoReset({ adminEmail, adminPassword }) {
  if (process.env.DEMO_MODE !== '1') {
    throw new Error('Refusing to reset: DEMO_MODE=1 is not set. This script deletes data and is for public demos only.');
  }
  await migrate();
  await db.query('TRUNCATE engagement_logs, feedback, notifications, analytics, ar_content, projects, users RESTART IDENTITY CASCADE');
  await seed();

  const hash = await bcrypt.hash(adminPassword, 12);
  await db.query("INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, 'Demo Admin', 'admin')", [adminEmail, hash]);

  const projects = (await db.query("SELECT id FROM projects WHERE status = 'published' ORDER BY id")).rows.map((r) => r.id);
  const actions = ['project_view', 'project_view', 'project_view', 'qr_scan', 'qr_scan', 'ar_launch', 'video_play', 'share'];
  for (let d = DAYS; d >= 0; d -= 1) {
    const events = Math.floor(8 + rng() * 40);
    for (let i = 0; i < events; i += 1) {
      await db.query(
        "INSERT INTO engagement_logs (action_type, project_id, created_at) VALUES ($1, $2, NOW() - ($3 || ' days')::interval - ($4 || ' minutes')::interval)",
        [pick(actions), pick(projects), d, Math.floor(rng() * 1000)]
      );
    }
    if (rng() < 0.5) {
      await db.query(
        "INSERT INTO feedback (project_id, rating, comment, created_at) VALUES ($1, $2, $3, NOW() - ($4 || ' days')::interval)",
        [pick(projects), 3 + Math.floor(rng() * 3), rng() < 0.6 ? pick(COMMENTS) : null, d]
      );
    }
  }
  return { projects: projects.length };
}

module.exports = { demoReset };

if (require.main === module) {
  const adminEmail = process.env.DEMO_ADMIN_EMAIL || 'demo@varhub.example';
  const adminPassword = process.env.DEMO_ADMIN_PASSWORD;
  if (!adminPassword || adminPassword.length < 8) {
    console.error('Set DEMO_ADMIN_PASSWORD (8+ characters) for the demo admin account.');
    process.exit(1);
  }
  demoReset({ adminEmail, adminPassword })
    .then((r) => console.log(`Demo reset: ${r.projects} projects, ${DAYS + 1} days of activity, admin ${adminEmail}`))
    .catch((err) => { console.error(err.message); process.exitCode = 1; })
    .finally(() => db.end());
}
