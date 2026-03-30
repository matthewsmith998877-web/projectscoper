const express = require('express');
const db = require('../db/database');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/roles — all authenticated users can read
router.get('/', requireAuth, (req, res) => {
  const roles = db.prepare('SELECT * FROM roles ORDER BY sort_order, name').all();
  res.json(roles);
});

// POST /api/roles — admin only
router.post('/', requireAdmin, (req, res) => {
  const { name, chargeout_rate, cost_rate } = req.body;
  if (!name || chargeout_rate == null) {
    return res.status(400).json({ error: 'Name and chargeout_rate are required' });
  }
  const effectiveCostRate = cost_rate != null ? cost_rate : Math.round(chargeout_rate * 0.6);
  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM roles').get().m || 0;
  try {
    const result = db.prepare(
      'INSERT INTO roles (name, chargeout_rate, cost_rate, sort_order) VALUES (?, ?, ?, ?)'
    ).run(name.trim(), chargeout_rate, effectiveCostRate, maxOrder + 1);
    const role = db.prepare('SELECT * FROM roles WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(role);
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Role name already exists' });
    throw err;
  }
});

// PUT /api/roles/:id — admin only
router.put('/:id', requireAdmin, (req, res) => {
  const { name, chargeout_rate, cost_rate } = req.body;
  const role = db.prepare('SELECT * FROM roles WHERE id = ?').get(req.params.id);
  if (!role) return res.status(404).json({ error: 'Role not found' });
  db.prepare(
    'UPDATE roles SET name = ?, chargeout_rate = ?, cost_rate = ? WHERE id = ?'
  ).run(
    name ?? role.name,
    chargeout_rate ?? role.chargeout_rate,
    cost_rate ?? role.cost_rate,
    role.id
  );
  res.json(db.prepare('SELECT * FROM roles WHERE id = ?').get(role.id));
});

// DELETE /api/roles/:id — admin only
router.delete('/:id', requireAdmin, (req, res) => {
  const role = db.prepare('SELECT * FROM roles WHERE id = ?').get(req.params.id);
  if (!role) return res.status(404).json({ error: 'Role not found' });
  const count = db.prepare('SELECT COUNT(*) as c FROM roles').get().c;
  if (count <= 1) return res.status(400).json({ error: 'Cannot delete the last role' });
  db.prepare('DELETE FROM roles WHERE id = ?').run(role.id);
  res.json({ success: true });
});

module.exports = router;
