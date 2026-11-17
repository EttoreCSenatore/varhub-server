// Promotes an existing account to admin. Usage: npm run admin:promote -- someone@example.com
require('dotenv').config();
const db = require('../db');

const email = (process.argv[2] || '').trim().toLowerCase();
if (!email) {
  console.error('Usage: npm run admin:promote -- <email>');
  process.exit(1);
}

db.query("UPDATE users SET role = 'admin' WHERE email = $1", [email])
  .then(({ rowCount }) => console.log(rowCount ? `${email} is now an admin` : `No account found for ${email} (register first)`))
  .catch((err) => { console.error(err); process.exitCode = 1; })
  .finally(() => db.end());
