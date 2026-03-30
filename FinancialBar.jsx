import React from 'react';
import { calcFinancials, formatCurrency, formatPercent } from '../utils/format.js';

export default function FinancialBar({ roles, tasks, hoursGrid, currency }) {
  const cur = currency || '£';
  const { rev, cost, profit, margin } = calcFinancials(roles, tasks, hoursGrid);

  const profitNeg  = rev > 0 && profit < 0;
  const marginNeg  = margin !== null && margin < 0;

  return (
    <div className="fin-bar">
      <div className="fin-card revenue">
        <div className="fin-card-label">Total Revenue</div>
        <div className="fin-card-val">{rev > 0 ? formatCurrency(rev, cur) : '—'}</div>
        <div className="fin-card-sub">Hours × chargeout rate</div>
      </div>
      <div className="fin-card costs">
        <div className="fin-card-label">Total Costs</div>
        <div className="fin-card-val">{cost > 0 ? formatCurrency(cost, cur) : '—'}</div>
        <div className="fin-card-sub">Hours × cost rate</div>
      </div>
      <div className="fin-card profit">
        <div className={`fin-card-val${profitNeg ? ' negative' : ''}`}>
          {rev > 0 ? formatCurrency(profit, cur) : '—'}
        </div>
        <div className="fin-card-label">Net Profit</div>
        <div className="fin-card-sub">Revenue minus costs</div>
      </div>
      <div className="fin-card margin">
        <div className={`fin-card-val${marginNeg ? ' negative' : ''}`}>
          {margin !== null ? formatPercent(margin) : '—'}
        </div>
        <div className="fin-card-label">Net Margin</div>
        <div className="fin-card-sub">Profit ÷ revenue</div>
      </div>
    </div>
  );
}
