import React from 'react';
import { formatCurrency, formatPercent, calcFinancials } from '../utils/format.js';
import { generatePdf } from '../utils/pdf.js';

export default function PdfModal({ onClose, roles, tasks, hoursGrid, scopeMeta }) {
  const cur = scopeMeta.currency || '£';
  const { rev, cost, profit, margin } = calcFinancials(roles, tasks, hoursGrid);
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  // Build preview rows
  const rows = [];
  let grandHrs = 0, grandRev = 0;
  roles.forEach(role => {
    let rHrs = 0, rRev = 0;
    tasks.forEach(task => {
      const h = parseFloat(hoursGrid[`${role.id}|${task.id}`]) || 0;
      rHrs += h; rRev += h * role.chargeout_rate;
    });
    if (rHrs === 0) return;
    grandHrs += rHrs; grandRev += rRev;
    rows.push({ role, rHrs, rRev });
  });

  function handleDownload() {
    generatePdf({
      clientName:         scopeMeta.clientName,
      projectName:        scopeMeta.name,
      projectTimeline:    scopeMeta.projectTimeline,
      preparedBy:         scopeMeta.preparedBy,
      projectDescription: scopeMeta.projectDescription,
      currency:           cur,
      roles, tasks, hoursGrid,
    });
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">Document Preview</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="pdf-doc">
          {/* Header */}
          <div className="pdf-doc-header">
            <div className="pdf-doc-title">{scopeMeta.clientName || '[Client Name]'}</div>
            <div className="pdf-doc-project">{scopeMeta.name || '[Project Name]'}</div>
            <div className="pdf-meta-grid">
              <div className="pdf-meta-item">
                <label>Timeline</label>
                <p>{scopeMeta.projectTimeline || '—'}</p>
              </div>
              <div className="pdf-meta-item">
                <label>Prepared by</label>
                <p>{scopeMeta.preparedBy || '—'}</p>
              </div>
              <div className="pdf-meta-item">
                <label>Date</label>
                <p>{today}</p>
              </div>
              <div className="pdf-meta-item">
                <label>Total Investment</label>
                <p style={{ fontWeight: 700, color: '#2d4a3e', fontSize: 16 }}>
                  {formatCurrency(grandRev, cur)}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          {scopeMeta.projectDescription && (
            <div className="pdf-desc">
              <strong style={{ fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#888' }}>
                Project Description
              </strong>
              <p style={{ marginTop: 6 }}>{scopeMeta.projectDescription}</p>
            </div>
          )}

          {/* Scope table */}
          <strong style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#888', display: 'block', marginBottom: 8 }}>
            Detailed Scope Breakdown
          </strong>
          <table className="pdf-scope-table">
            <thead>
              <tr>
                <th>Role</th>
                {tasks.map(t => <th key={t.id}>{t.name}</th>)}
                <th>Hours</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={tasks.length + 3} style={{ textAlign: 'center', padding: '1rem', color: '#999' }}>No hours entered</td></tr>
              ) : rows.map(({ role, rHrs, rRev }) => (
                <tr key={role.id}>
                  <td>{role.name}</td>
                  {tasks.map(task => {
                    const h = parseFloat(hoursGrid[`${role.id}|${task.id}`]) || 0;
                    return <td key={task.id} className="num">{h || '—'}</td>;
                  })}
                  <td className="num"><strong>{rHrs}</strong></td>
                  <td className="num"><strong>{formatCurrency(rRev, cur)}</strong></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td><strong>Total</strong></td>
                {tasks.map(task => {
                  let h = 0;
                  roles.forEach(r => { h += parseFloat(hoursGrid[`${r.id}|${task.id}`]) || 0; });
                  return <td key={task.id} className="num">{h || '—'}</td>;
                })}
                <td className="num">{grandHrs}</td>
                <td className="num">{formatCurrency(grandRev, cur)}</td>
              </tr>
            </tfoot>
          </table>

          {/* Financials summary line */}
          <div style={{ display: 'flex', gap: '2rem', fontSize: 13, marginBottom: '1rem', flexWrap: 'wrap' }}>
            <span><strong>Total Cost:</strong> {formatCurrency(cost, cur)}</span>
            <span><strong>Net Profit:</strong> {formatCurrency(profit, cur)}</span>
            {margin !== null && <span><strong>Net Margin:</strong> {formatPercent(margin)}</span>}
          </div>

          <p className="pdf-confidential">
            This document is confidential and prepared exclusively for {scopeMeta.clientName || 'the client'}.
            All rates and timelines are estimates subject to project confirmation.
          </p>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
          <button className="btn-primary" onClick={handleDownload}>⬇ Download PDF</button>
        </div>
      </div>
    </div>
  );
}
