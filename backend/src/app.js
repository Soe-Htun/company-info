const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const userRoutes = require('./routes/users');

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/users', userRoutes);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error('Unexpected error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Unexpected server error',
  });
});

module.exports = app;
