import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import FinancialBar from '../components/FinancialBar.jsx';
import PdfModal from '../components/PdfModal.jsx';
import { formatCurrency } from '../utils/format.js';

export default function SummaryPage({ toast }) {
  const { roles, tasks, hoursGrid, scopeMeta, updateScopeMeta, loadRoles, loadTasks } = useApp();
  const [showPdf, setShowPdf] = useState(false);

  useEffect(() => { loadRoles(); loadTasks(); }, []);

  // Sync Project Name from Scope Name unless user has manually changed it
  function handleProjectNameChange(val) {
    updateScopeMeta({ name: val, projectNameManuallyEdited: true });
  }

  // Build summary rows
  const cur = scopeMeta.currency || '£';
  let grandHrs = 0, grandRev = 0;
  const summaryRows = [];
  roles.forEach(role => {
    let rHrs = 0, rRev = 0;
    tasks.forEach(task => {
      const h = parseFloat(hoursGrid[`${role.id}|${task.id}`]) || 0;
      rHrs += h;
      rRev += h * role.chargeout_rate;
    });
    if (rHrs === 0) return;
    grandHrs += rHrs;
    grandRev += rRev;
    summaryRows.push({ role, rHrs, rRev });
  });

  return (
    <div className="summary-wrap">
      {/* Financial boxes */}
      <FinancialBar roles={roles} tasks={tasks} hoursGrid={hoursGrid} currency={cur} />

      {/* Project details */}
      <div className="summary-section">
        <h3>Project Details</h3>
        <div className="summary-grid">
          <div className="summary-field">
            <label>Client Name</label>
            <input
              type="text"
              value={scopeMeta.clientName}
              onChange={e => updateScopeMeta({ clientName: e.target.value })}
              placeholder="Acme Corporation"
            />
          </div>
          <div className="summary-field">
            <label>Project Name</label>
            <input
              type="text"
              value={scopeMeta.name}
              onChange={e => handleProjectNameChange(e.target.value)}
              placeholder="Brand Refresh 2025"
            />
          </div>
          <div className="summary-field">
            <label>Project Timeline</label>
            <input
              type="text"
              value={scopeMeta.projectTimeline}
              onChange={e => updateScopeMeta({ projectTimeline: e.target.value })}
              placeholder="8 weeks · Apr–Jun 2025"
            />
          </div>
          <div className="summary-field">
            <label>Prepared by</label>
            <input
              type="text"
              value={scopeMeta.preparedBy}
              onChange={e => updateScopeMeta({ preparedBy: e.target.value })}
              placeholder="Your name"
            />
          </div>
          <div className="summary-field summary-full">
            <label>Project Description</label>
            <textarea
              value={scopeMeta.projectDescription}
              onChange={e => updateScopeMeta({ projectDescription: e.target.value })}
              placeholder="Brief overview of the project scope, objectives, and deliverables..."
            />
          </div>
        </div>
      </div>

      {/* Scope summary table */}
      <div className="summary-section">
        <h3>Scope Summary</h3>
        <table className="summary-table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Hours</th>
              <th>Rate</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {summaryRows.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text2)', padding: '1.5rem' }}>
                  No hours entered yet. Go to "New Scope" to enter hours.
                </td>
              </tr>
            ) : summaryRows.map(({ role, rHrs, rRev }) => (
              <tr key={role.id}>
                <td>{role.name}</td>
                <td className="num">{rHrs}</td>
                <td className="num">{cur}{role.chargeout_rate}/hr</td>
                <td className="num">{formatCurrency(rRev, cur)}</td>
              </tr>
            ))}
          </tbody>
          {grandHrs > 0 && (
            <tfoot>
              <tr>
                <td>Total</td>
                <td className="num">{grandHrs}</td>
                <td />
                <td className="num">{formatCurrency(grandRev, cur)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <button className="pdf-btn" onClick={() => setShowPdf(true)}>
        <svg style={{ width: 16, height: 16, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 }} viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
        Generate PDF Document
      </button>

      {showPdf && (
        <PdfModal
          onClose={() => setShowPdf(false)}
          roles={roles}
          tasks={tasks}
          hoursGrid={hoursGrid}
          scopeMeta={scopeMeta}
        />
      )}
    </div>
  );
}
