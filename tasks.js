const express = require('express');
const db = require('../db/database');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/tasks
router.get('/', requireAuth, (req, res) => {
  const tasks = db.prepare('SELECT * FROM tasks ORDER BY sort_order, name').all();
  res.json(tasks);
});

// POST /api/tasks — admin only
router.post('/', requireAdmin, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM tasks').get().m || 0;
  try {
    const result = db.prepare(
      'INSERT INTO tasks (name, sort_order) VALUES (?, ?)'
    ).run(name.trim(), maxOrder + 1);
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(task);
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Task name already exists' });
    throw err;
  }
});

// DELETE /api/tasks/:id — admin only
router.delete('/:id', requireAdmin, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const count = db.prepare('SELECT COUNT(*) as c FROM tasks').get().c;
  if (count <= 1) return res.status(400).json({ error: 'Cannot delete the last task' });
  db.prepare('DELETE FROM tasks WHERE id = ?').run(task.id);
  res.json({ success: true });
});

module.exports = router;
