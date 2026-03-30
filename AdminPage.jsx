import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';

export default function AdminPage({ toast }) {
  const { roles, tasks, loadRoles, loadTasks, addRole, deleteRole, addTask, deleteTask } = useApp();

  // New task form
  const [newTask, setNewTask] = useState('');

  // New role form
  const [newRoleName, setNewRoleName]   = useState('');
  const [newChargeout, setNewChargeout] = useState('');
  const [newCostRate,  setNewCostRate]  = useState('');

  useEffect(() => { loadRoles(); loadTasks(); }, []);

  async function handleAddTask(e) {
    e.preventDefault();
    if (!newTask.trim()) return;
    try {
      await addTask(newTask.trim());
      setNewTask('');
      toast('Task added');
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function handleDeleteTask(id, name) {
    if (!window.confirm(`Remove task "${name}"?`)) return;
    try {
      await deleteTask(id);
      toast('Task removed');
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function handleAddRole(e) {
    e.preventDefault();
    const chargeout = parseFloat(newChargeout);
    if (!newRoleName.trim() || !chargeout) {
      toast('Enter a role name and chargeout rate', 'error');
      return;
    }
    const costRate = newCostRate ? parseFloat(newCostRate) : Math.round(chargeout * 0.6);
    try {
      await addRole(newRoleName.trim(), chargeout, costRate);
      setNewRoleName(''); setNewChargeout(''); setNewCostRate('');
      toast('Role added');
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function handleDeleteRole(id, name) {
    if (!window.confirm(`Remove role "${name}"? This will affect any saved scopes that reference it.`)) return;
    try {
      await deleteRole(id);
      toast('Role removed');
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em' }}>Admin Panel</h2>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>
          Manage tasks and roles available across the application
        </p>
      </div>

      <div className="admin-grid">
        {/* ── TASKS PANEL ── */}
        <div className="admin-panel">
          <h3>Task Types <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text3)' }}>({tasks.length})</span></h3>
          <ul className="admin-list">
            {tasks.map(t => (
              <li key={t.id}>
                <span className="role-name">{t.name}</span>
                <button className="del-btn" title="Remove task" onClick={() => handleDeleteTask(t.id, t.name)}>×</button>
              </li>
            ))}
          </ul>
          <form className="add-row" onSubmit={handleAddTask}>
            <input
              className="inp-name"
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              placeholder="New task name..."
            />
            <button className="btn-add" type="submit">Add</button>
          </form>
          <p className="admin-note">Tasks form the columns of the scoping grid.</p>
        </div>

        {/* ── ROLES PANEL ── */}
        <div className="admin-panel">
          <h3>Roles <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text3)' }}>({roles.length})</span></h3>
          <ul className="admin-list">
            {roles.map(r => (
              <li key={r.id}>
                <span className="role-name">{r.name}</span>
                <div className="rate-pair">
                  <span className="rate-tag chargeout" title="Chargeout rate">↑ {r.chargeout_rate}/hr</span>
                  <span className="rate-tag cost"      title="Cost rate">↓ {r.cost_rate}/hr</span>
                </div>
                <button className="del-btn" title="Remove role" onClick={() => handleDeleteRole(r.id, r.name)}>×</button>
              </li>
            ))}
          </ul>

          {/* Column labels */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 6, padding: '0 2px' }}>
            <span style={{ flex: 3, fontSize: 10, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text3)' }}>Role name</span>
            <span style={{ flex: 1.2, fontSize: 10, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text3)' }}>Chargeout</span>
            <span style={{ flex: 1.2, fontSize: 10, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text3)' }}>Cost rate</span>
            <span style={{ width: 32 }} />
          </div>

          <form className="add-row" onSubmit={handleAddRole}>
            <input
              className="inp-name"
              value={newRoleName}
              onChange={e => setNewRoleName(e.target.value)}
              placeholder="Role name..."
            />
            <input
              className="inp-rate"
              type="number"
              value={newChargeout}
              onChange={e => setNewChargeout(e.target.value)}
              placeholder="e.g. 120"
            />
            <input
              className="inp-rate"
              type="number"
              value={newCostRate}
              onChange={e => setNewCostRate(e.target.value)}
              placeholder="e.g. 72"
            />
            <button className="btn-add" type="submit">Add</button>
          </form>
          <p className="admin-note">
            Chargeout = rate billed to client. Cost = internal cost. Leave cost blank to default to 60% of chargeout.
          </p>
        </div>
      </div>
    </div>
  );
}
