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

router.put('/:id', async (req, res, next) => {
  const { username, password, role } = req.body || {};
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId)) {
    return res.status(400).json({ message: 'Invalid user id' });
  }
  if (!username && !password && !role) {
    return res.status(400).json({ message: 'No fields to update' });
  }
  try {
    const [existingRows] = await pool.execute('SELECT id FROM users WHERE id = ?', [userId]);
    if (!existingRows.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updates = [];
    const values = [];
    if (username) {
      updates.push('username = ?');
      values.push(username);
    }
    if (role) {
      updates.push('role = ?');
      values.push(role);
    }
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      updates.push('password_hash = ?');
      values.push(passwordHash);
    }
    if (!updates.length) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    const setClause = updates.join(', ');
    values.push(userId);
    await pool.execute(`UPDATE users SET ${setClause} WHERE id = ?`, values);
    const [[updated]] = await pool.execute('SELECT id, username, role, created_at AS createdAt FROM users WHERE id = ?', [
      userId,
    ]);
    return res.json(updated);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Username already exists' });
    }
    return next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId)) {
    return res.status(400).json({ message: 'Invalid user id' });
  }
  try {
    const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
    if (!result.affectedRows) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
