import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { formatCurrency } from '../utils/format.js';

export default function Dashboard({ toast }) {
  const navigate = useNavigate();
  const { scopes, roles, tasks, loadScopes, loadScopeIntoGrid, deleteScope, clearGrid } = useApp();

  useEffect(() => { loadScopes(); }, []);

  function handleLoad(scope) {
    loadScopeIntoGrid(scope);
    navigate('/scope');
    toast('Scope loaded');
  }

  async function handleDelete(scope) {
    if (!window.confirm(`Delete "${scope.name}"? This cannot be undone.`)) return;
    try {
      await deleteScope(scope.id);
      toast('Scope deleted');
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  function handleNew() {
    clearGrid();
    navigate('/scope');
  }

  // Compute totals across all scopes for stat cards
  const totalHrsAll = scopes.reduce((sum, s) => {
    return sum + (s.hours || []).reduce((a, h) => a + h.hours, 0);
  }, 0);

  const stats = [
    { label: 'Total Scopes',  val: scopes.length,                                        sub: 'all time' },
    { label: 'Draft Scopes',  val: scopes.filter(s => s.status === 'draft').length,       sub: 'in progress' },
    { label: 'Total Hours',   val: Math.round(totalHrsAll).toLocaleString('en-GB'),        sub: 'across all scopes' },
    { label: 'Roles',         val: roles.length,                                           sub: 'configured' },
  ];

  return (
    <div>
      {/* Stat cards */}
      <div className="dash-stat-grid">
        {stats.map(s => (
          <div key={s.label} className="dash-stat-card">
            <div className="dash-stat-label">{s.label}</div>
            <div className="dash-stat-val">{s.val}</div>
            <div className="dash-stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Recent scopes */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div className="section-title" style={{ marginBottom: 0 }}>Recent Scopes</div>
        <button className="btn-primary" style={{ padding: '6px 14px', fontSize: 13 }} onClick={handleNew}>
          + New Scope
        </button>
      </div>

      <div className="scope-list">
        {scopes.length === 0 ? (
          <div className="empty-state">
            <strong>No scopes yet</strong>
            <p>Create your first scope using the button above.</p>
          </div>
        ) : scopes.map(scope => {
          // Compute revenue for this scope using current rates
          const totalHrs = (scope.hours || []).reduce((a, h) => a + h.hours, 0);
          const totalRev = (scope.hours || []).reduce((a, h) => a + h.hours * (h.chargeout_rate || 0), 0);
          const cur = scope.currency || '£';
          return (
            <div key={scope.id} className="scope-item">
              <div>
                <div className="scope-item-name">
                  {scope.client_name && <span style={{ color: 'var(--text2)', fontWeight: 400 }}>{scope.client_name} — </span>}
                  {scope.name}
                </div>
                <div className="scope-item-meta">
                  {new Date(scope.created_at).toLocaleDateString('en-GB')}
                  {' · '}{totalHrs} hrs
                  {totalRev > 0 && <> · {formatCurrency(totalRev, cur)}</>}
                </div>
              </div>
              <div className="scope-item-right">
                <span className={`badge badge-${scope.status}`}>{scope.status}</span>
                <button className="btn-secondary" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => handleLoad(scope)}>Load</button>
                <button className="del-btn" title="Delete scope" onClick={() => handleDelete(scope)}>×</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
