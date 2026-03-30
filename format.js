export function formatCurrency(value, symbol = '£') {
  if (!value && value !== 0) return '—';
  return symbol + Math.round(value).toLocaleString('en-GB');
}

export function formatPercent(value) {
  if (value === null || value === undefined) return '—';
  return (Math.round(value * 1000) / 10).toFixed(1) + '%';
}

export function calcFinancials(roles, tasks, hoursGrid) {
  let rev = 0, cost = 0;
  roles.forEach(role => {
    tasks.forEach(task => {
      const key = `${role.id}|${task.id}`;
      const h = parseFloat(hoursGrid[key]) || 0;
      rev  += h * role.chargeout_rate;
      cost += h * role.cost_rate;
    });
  });
  const profit = rev - cost;
  const margin = rev > 0 ? profit / rev : null;
  return { rev, cost, profit, margin };
}

export function totalHours(roles, tasks, hoursGrid) {
  let total = 0;
  roles.forEach(role => {
    tasks.forEach(task => {
      total += parseFloat(hoursGrid[`${role.id}|${task.id}`]) || 0;
    });
  });
  return total;
}
