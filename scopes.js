const express = require('express');
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/scopes — current user's scopes
router.get('/', requireAuth, (req, res) => {
  const scopes = db.prepare(
    'SELECT * FROM scopes WHERE user_id = ? ORDER BY updated_at DESC'
  ).all(req.user.id);

  // Attach hours to each scope
  const result = scopes.map(scope => {
    const hours = db.prepare(
      `SELECT sh.role_id, sh.task_id, sh.hours, r.name as role_name, r.chargeout_rate, r.cost_rate, t.name as task_name
       FROM scope_hours sh
       JOIN roles r ON r.id = sh.role_id
       JOIN tasks t ON t.id = sh.task_id
       WHERE sh.scope_id = ?`
    ).all(scope.id);
    return { ...scope, hours };
  });
  res.json(result);
});

// GET /api/scopes/:id
router.get('/:id', requireAuth, (req, res) => {
  const scope = db.prepare('SELECT * FROM scopes WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!scope) return res.status(404).json({ error: 'Scope not found' });
  const hours = db.prepare(
    `SELECT sh.role_id, sh.task_id, sh.hours, r.name as role_name, r.chargeout_rate, r.cost_rate, t.name as task_name
     FROM scope_hours sh
     JOIN roles r ON r.id = sh.role_id
     JOIN tasks t ON t.id = sh.task_id
     WHERE sh.scope_id = ?`
  ).all(scope.id);
  res.json({ ...scope, hours });
});

// POST /api/scopes — create new scope
router.post('/', requireAuth, (req, res) => {
  const {
    name, client_name, project_timeline, prepared_by,
    project_description, currency, status, hours
  } = req.body;

  const result = db.prepare(
    `INSERT INTO scopes (user_id, name, client_name, project_timeline, prepared_by, project_description, currency, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    req.user.id,
    name || 'Unnamed Scope',
    client_name || null,
    project_timeline || null,
    prepared_by || null,
    project_description || null,
    currency || '£',
    status || 'draft'
  );

  const scopeId = result.lastInsertRowid;

  // Insert hours
  if (Array.isArray(hours)) {
    const insertHour = db.prepare(
      'INSERT OR REPLACE INTO scope_hours (scope_id, role_id, task_id, hours) VALUES (?, ?, ?, ?)'
    );
    const insertMany = db.transaction(hrs => hrs.forEach(h => insertHour.run(scopeId, h.role_id, h.task_id, h.hours)));
    insertMany(hours.filter(h => h.hours > 0));
  }

  const scope = db.prepare('SELECT * FROM scopes WHERE id = ?').get(scopeId);
  const savedHours = db.prepare(
    `SELECT sh.role_id, sh.task_id, sh.hours, r.name as role_name, r.chargeout_rate, r.cost_rate, t.name as task_name
     FROM scope_hours sh
     JOIN roles r ON r.id = sh.role_id
     JOIN tasks t ON t.id = sh.task_id
     WHERE sh.scope_id = ?`
  ).all(scopeId);
  res.status(201).json({ ...scope, hours: savedHours });
});

// PUT /api/scopes/:id — update scope
router.put('/:id', requireAuth, (req, res) => {
  const scope = db.prepare('SELECT * FROM scopes WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!scope) return res.status(404).json({ error: 'Scope not found' });

  const {
    name, client_name, project_timeline, prepared_by,
    project_description, currency, status, hours
  } = req.body;

  db.prepare(
    `UPDATE scopes SET
      name = ?, client_name = ?, project_timeline = ?, prepared_by = ?,
      project_description = ?, currency = ?, status = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(
    name ?? scope.name,
    client_name ?? scope.client_name,
    project_timeline ?? scope.project_timeline,
    prepared_by ?? scope.prepared_by,
    project_description ?? scope.project_description,
    currency ?? scope.currency,
    status ?? scope.status,
    scope.id
  );

  // Replace hours
  if (Array.isArray(hours)) {
    db.prepare('DELETE FROM scope_hours WHERE scope_id = ?').run(scope.id);
    const insertHour = db.prepare(
      'INSERT INTO scope_hours (scope_id, role_id, task_id, hours) VALUES (?, ?, ?, ?)'
    );
    const insertMany = db.transaction(hrs => hrs.forEach(h => insertHour.run(scope.id, h.role_id, h.task_id, h.hours)));
    insertMany(hours.filter(h => h.hours > 0));
  }

  const updated = db.prepare('SELECT * FROM scopes WHERE id = ?').get(scope.id);
  const savedHours = db.prepare(
    `SELECT sh.role_id, sh.task_id, sh.hours, r.name as role_name, r.chargeout_rate, r.cost_rate, t.name as task_name
     FROM scope_hours sh
     JOIN roles r ON r.id = sh.role_id
     JOIN tasks t ON t.id = sh.task_id
     WHERE sh.scope_id = ?`
  ).all(scope.id);
  res.json({ ...updated, hours: savedHours });
});

// DELETE /api/scopes/:id
router.delete('/:id', requireAuth, (req, res) => {
  const scope = db.prepare('SELECT * FROM scopes WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!scope) return res.status(404).json({ error: 'Scope not found' });
  db.prepare('DELETE FROM scopes WHERE id = ?').run(scope.id);
  res.json({ success: true });
});

module.exports = router;
