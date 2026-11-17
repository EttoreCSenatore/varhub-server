// Applies db/migrations/*.sql in order, once each. Usage: npm run db:migrate  (or db:seed for demo data)
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const db = require('../db');

const DIR = path.join(__dirname, '..', 'db', 'migrations');

async function migrate() {
  await db.query('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMP DEFAULT NOW())');
  const done = new Set((await db.query('SELECT name FROM schema_migrations')).rows.map((r) => r.name));
  const applied = [];
  for (const file of fs.readdirSync(DIR).filter((f) => f.endsWith('.sql')).sort()) {
    if (done.has(file)) continue;
    await db.query(fs.readFileSync(path.join(DIR, file), 'utf8'));
    await db.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
    applied.push(file);
  }
  return applied;
}

async function seed() {
  await db.query(fs.readFileSync(path.join(__dirname, '..', 'db', 'seed.sql'), 'utf8'));
}

module.exports = { migrate, seed };

if (require.main === module) {
  (async () => {
    const applied = await migrate();
    console.log(applied.length ? `Applied: ${applied.join(', ')}` : 'Database is up to date');
    if (process.argv.includes('--seed')) {
      await seed();
      console.log('Seeded demo projects');
    }
  })()
    .catch((err) => { console.error(err); process.exitCode = 1; })
    .finally(() => db.end());
}
