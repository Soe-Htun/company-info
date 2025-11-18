require('dotenv').config();
const app = require('./app');
const pool = require('./db/pool');
const { ensureUsersTable } = require('./db/ensureUsersTable');

const PORT = process.env.PORT || 5000;
async function start() {
  try {
    await pool.query('SELECT 1');
    console.log('Database connection established');
    await ensureUsersTable();
    console.log('Verified users table');
  } catch (err) {
    console.error('Unable to connect to MySQL. Check your .env configuration.', err.message);
  }

  app.listen(PORT, () => {
    console.log(`API ready on http://localhost:${PORT}`);
  });
}

start();
