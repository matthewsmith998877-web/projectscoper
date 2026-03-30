import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import FinancialBar from '../components/FinancialBar.jsx';
import { totalHours } from '../utils/format.js';

export default function ScopingPage({ toast }) {
  const navigate = useNavigate();
  const {
    roles, tasks, hoursGrid, getHours, setHours,
    scopeMeta, updateScopeMeta,
    loadRoles, loadTasks,
    clearGrid, saveScope,
  } = useApp();

  useEffect(() => {
    loadRoles();
    loadTasks();
  }, []);

  // Scope name → sync to summary's project name unless manually overridden
  function handleScopeNameChange(val) {
    updateScopeMeta({
      name: val,
      ...(!scopeMeta.projectNameManuallyEdited ? {} : {}),
    });
  }

  async function handleSave() {
    if (totalHours(roles, tasks, hoursGrid) === 0) {
      toast('Enter some hours first', 'error');
      return;
    }
    try {
      await saveScope();
      toast('Scope saved!');
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  function handleClear() {
    clearGrid();
    toast('Grid cleared');
  }

  // ── PER-ROLE TOTALS ──────────────────────────────────────────────────────
  function roleTotals(role) {
    let hrs = 0, rev = 0;
    tasks.forEach(task => {
      const h = getHours(role.id, task.id);
      hrs += h;
      rev += h * role.chargeout_rate;
    });
    return { hrs, rev };
  }

  // ── PER-TASK TOTALS ──────────────────────────────────────────────────────
  function taskTotals(task) {
    let hrs = 0, rev = 0;
    roles.forEach(role => {
      const h = getHours(role.id, task.id);
      hrs += h;
      rev += h * role.chargeout_rate;
    });
    return { hrs, rev };
  }

  // ── GRAND TOTALS ─────────────────────────────────────────────────────────
  function grandTotals() {
    let hrs = 0, rev = 0;
    roles.forEach(role => tasks.forEach(task => {
      const h = getHours(role.id, task.id);
      hrs += h;
      rev += h * role.chargeout_rate;
    }));
    return { hrs, rev };
  }

  const cur = scopeMeta.currency || '£';
  const fmt = (v) => v ? cur + Math.round(v).toLocaleString('en-GB') : '—';
  const grand = grandTotals();

  if (!roles.length || !tasks.length) {
    return <div className="page-loading"><div className="spinner" /></div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em' }}>Hours & Rates</h2>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>Enter hours per role and task</p>
      </div>

      {/* Financial summary boxes */}
      <FinancialBar roles={roles} tasks={tasks} hoursGrid={hoursGrid} currency={cur} />

      {/* Controls bar */}
      <div className="controls-bar">
        <div className="ctrl-field">
          <label>Scope Name</label>
          <input
            className="scope-name-input"
            type="text"
            value={scopeMeta.name}
            onChange={e => handleScopeNameChange(e.target.value)}
            placeholder="e.g. Brand Refresh 2025"
          />
        </div>
        <div className="ctrl-divider" />
        <div className="ctrl-field">
          <label>Currency</label>
          <select value={scopeMeta.currency} onChange={e => updateScopeMeta({ currency: e.target.value })}>
            <option value="£">£ GBP</option>
            <option value="$">$ USD</option>
            <option value="€">€ EUR</option>
          </select>
        </div>
      </div>

      {/* Hours grid */}
      <div className="grid-wrap">
        <table className="scope-table">
          <thead>
            <tr>
              <th>Role / Task</th>
              {tasks.map(t => <th key={t.id} className="task-col">{t.name}</th>)}
              <th className="total-col">Total Hrs</th>
              <th className="total-col">Total Revenue</th>
            </tr>
          </thead>
          <tbody>
            {roles.map(role => {
              const { hrs, rev } = roleTotals(role);
              return (
                <tr key={role.id}>
                  <td className="role-cell">
                    {role.name}
                    <br />
                    <span className="role-rate">
                      {cur}{role.chargeout_rate}/hr &nbsp;·&nbsp; cost {cur}{role.cost_rate}/hr
                    </span>
                  </td>
                  {tasks.map(task => (
                    <td key={task.id} style={{ textAlign: 'center' }}>
                      <input
                        className="hours-input"
                        type="number"
                        min="0"
                        step="0.5"
                        value={getHours(role.id, task.id) || ''}
                        placeholder="0"
                        onChange={e => setHours(role.id, task.id, e.target.value)}
                      />
                    </td>
                  ))}
                  <td className="total-cell" style={{ textAlign: 'right' }}>{hrs || '—'}</td>
                  <td className="total-cell" style={{ textAlign: 'right' }}>{fmt(rev)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td style={{ fontWeight: 600, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text2)' }}>
                Total Hours
              </td>
              {tasks.map(task => {
                const { hrs } = taskTotals(task);
                return (
                  <td key={task.id} className="total-cell" style={{ textAlign: 'center' }}>
                    {hrs || '—'}
                  </td>
                );
              })}
              <td className="total-cell" style={{ textAlign: 'right', color: 'var(--accent)' }}>{grand.hrs || 0}</td>
              <td className="total-cell" style={{ textAlign: 'right', color: 'var(--accent)' }}>{fmt(grand.rev)}</td>
            </tr>
            <tr className="cost-row">
              <td style={{ fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text2)' }}>
                Task Revenue
              </td>
              {tasks.map(task => {
                const { rev } = taskTotals(task);
                return (
                  <td key={task.id} style={{ textAlign: 'center' }}>{fmt(rev)}</td>
                );
              })}
              <td />
              <td className="cost-total" style={{ textAlign: 'right' }}>{fmt(grand.rev)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="scope-actions">
        <button className="btn-secondary" onClick={handleClear}>Clear</button>
        <button className="btn-secondary" onClick={handleSave}>Save Scope</button>
        <button className="btn-primary" onClick={() => navigate('/summary')}>Generate Summary →</button>
      </div>
    </div>
  );
}
