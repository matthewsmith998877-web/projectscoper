require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// ── MIDDLEWARE ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// ── ROUTES ────────────────────────────────────────────────────────────────────
app.use('/api/auth',   require('./routes/auth'));
app.use('/api/roles',  require('./routes/roles'));
app.use('/api/tasks',  require('./routes/tasks'));
app.use('/api/scopes', require('./routes/scopes'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ── ERROR HANDLER ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── START ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`[server] ScopeBuilder API running on http://localhost:${PORT}`);
});
