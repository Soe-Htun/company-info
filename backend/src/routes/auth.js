const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const authenticate = require('../middleware/authenticate');
const pool = require('../db/pool');

const router = express.Router();

router.post('/login', async (req, res, next) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT id, username, password_hash AS passwordHash, role FROM users WHERE username = ? LIMIT 1',
      [username],
    );

    if (!rows.length) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role || 'admin',
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.TOKEN_EXPIRES_IN || '4h' },
    );

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role || 'admin',
      },
    });
  } catch (err) {
    return next(err);
  }

});

router.get('/profile', authenticate, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
