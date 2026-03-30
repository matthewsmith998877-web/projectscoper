import jsPDF from 'jspdf';
import { calcFinancials, formatPercent } from './format.js';

export function generatePdf({ clientName, projectName, projectTimeline, preparedBy, projectDescription, currency, roles, tasks, hoursGrid }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const cur = currency || '£';
  const W = 297, M = 20;
  let y = M;
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  // ── HEADER BAR ──────────────────────────────────────────────────────────────
  doc.setFillColor(45, 74, 62);
  doc.rect(0, 0, W, 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(clientName || 'Client', M, 13);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(projectName || 'Project Scope', M, 18.5);
  doc.setFontSize(9);
  doc.text(today, W - M, 13, { align: 'right' });

  // ── META ROW ────────────────────────────────────────────────────────────────
  y = 30;
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('TIMELINE', M, y);
  doc.text('PREPARED BY', M + 70, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(9);
  doc.text(projectTimeline || '—', M, y + 5);
  doc.text(preparedBy || '—', M + 70, y + 5);
  y += 16;

  // ── DESCRIPTION ─────────────────────────────────────────────────────────────
  if (projectDescription) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text('PROJECT DESCRIPTION', M, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(8);
    const lines = doc.splitTextToSize(projectDescription, W - 2 * M);
    doc.text(lines, M, y);
    y += lines.length * 4 + 6;
  }

  // ── BUILD TABLE DATA ─────────────────────────────────────────────────────────
  let grandHrs = 0, grandRev = 0;
  const tableData = [];

  roles.forEach(role => {
    let rHrs = 0, rRev = 0;
    const row = [role.name];
    tasks.forEach(task => {
      const h = parseFloat(hoursGrid[`${role.id}|${task.id}`]) || 0;
      rHrs += h;
      rRev += h * role.chargeout_rate;
      row.push(h || '');
    });
    if (rHrs === 0) return;
    grandHrs += rHrs;
    grandRev += rRev;
    row.push(String(rHrs));
    row.push(cur + rRev.toLocaleString('en-GB'));
    tableData.push(row);
  });

  const taskTotals = tasks.map(task => {
    let h = 0;
    roles.forEach(role => { h += parseFloat(hoursGrid[`${role.id}|${task.id}`]) || 0; });
    return h || '';
  });
  tableData.push(['TOTAL', ...taskTotals, String(grandHrs), cur + grandRev.toLocaleString('en-GB')]);

  // ── TABLE HEADER ─────────────────────────────────────────────────────────────
  const colW = Math.min(26, (W - M * 2 - 65) / (tasks.length || 1));
  const headers = ['Role', ...tasks.map(t => t.name), 'Hours', 'Revenue'];
  let cx = M;

  doc.setFillColor(45, 74, 62);
  doc.rect(M, y, W - 2 * M, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  headers.forEach((h, i) => {
    const cw = i === 0 ? 55 : i === headers.length - 1 ? 28 : i === headers.length - 2 ? 16 : colW;
    doc.text(String(h).substring(0, 14), cx + 1, y + 4.8);
    cx += cw;
  });
  y += 9;

  // ── TABLE ROWS ───────────────────────────────────────────────────────────────
  tableData.forEach((row, ri) => {
    const isLast = ri === tableData.length - 1;
    if (isLast) {
      doc.setFillColor(232, 240, 238);
      doc.rect(M, y - 1, W - 2 * M, 7, 'F');
    } else if (ri % 2 === 0) {
      doc.setFillColor(248, 248, 246);
      doc.rect(M, y - 1, W - 2 * M, 7, 'F');
    }
    doc.setTextColor(isLast ? 45 : 40, isLast ? 74 : 40, isLast ? 62 : 40);
    doc.setFont('helvetica', isLast ? 'bold' : 'normal');
    doc.setFontSize(7.5);
    cx = M;
    row.forEach((cell, i) => {
      const cw = i === 0 ? 55 : i === row.length - 1 ? 28 : i === row.length - 2 ? 16 : colW;
      doc.text(String(cell).substring(0, 20), cx + 1, y + 4);
      cx += cw;
    });
    y += 7;
  });

  // ── FINANCIALS SUMMARY ───────────────────────────────────────────────────────
  const { cost, profit, margin } = calcFinancials(roles, tasks, hoursGrid);
  y += 8;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(45, 74, 62);
  doc.text(`Total Revenue: ${cur}${grandRev.toLocaleString('en-GB')}`, M, y);
  doc.text(`Total Cost: ${cur}${Math.round(cost).toLocaleString('en-GB')}`, M + 65, y);
  doc.text(`Net Profit: ${cur}${Math.round(profit).toLocaleString('en-GB')}`, M + 130, y);
  if (margin !== null) doc.text(`Net Margin: ${formatPercent(margin)}`, M + 195, y);

  // ── FOOTER ───────────────────────────────────────────────────────────────────
  y += 10;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(170, 170, 170);
  doc.text(
    `This document is confidential and prepared exclusively for ${clientName || 'the client'}. All rates and timelines are estimates subject to project confirmation.`,
    M, y
  );

  doc.save(`${(clientName || 'client').replace(/\s/g, '_')}_${(projectName || 'scope').replace(/\s/g, '_')}_scope.pdf`);
}
