const express = require('express');
const bcrypt = require('bcryptjs');

const authenticate = require('../middleware/authenticate');
const pool = require('../db/pool');

const router = express.Router();

router.use(authenticate);
router.use((req, res, next) => {
  if (req.user?.role && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin privileges required' });
  }
  return next();
});

router.get('/', async (_req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, username, role, created_at AS createdAt FROM users ORDER BY created_at DESC',
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  const { username, password, role = 'admin' } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
      [username, passwordHash, role],
    );
    return res.status(201).json({
      id: result.insertId,
      username,
      role,
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Username already exists' });
    }
    return next(err);
  }
});

module.exports = router;
