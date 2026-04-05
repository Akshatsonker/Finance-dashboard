const { prepare } = require('../database');

function getSummary(req, res) {
  const { from, to } = req.query;
  let dateFilter = 'AND r.is_deleted = 0';
  const params = [];

  if (from) { dateFilter += ' AND r.date >= ?'; params.push(from); }
  if (to)   { dateFilter += ' AND r.date <= ?'; params.push(to); }

  const totals = prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
      COUNT(*) as total_transactions
    FROM financial_records r WHERE 1=1 ${dateFilter}
  `).get(...params);

  const categoryBreakdown = prepare(`
    SELECT category, type, COALESCE(SUM(amount), 0) as total, COUNT(*) as count
    FROM financial_records r WHERE 1=1 ${dateFilter}
    GROUP BY category, type ORDER BY total DESC
  `).all(...params);

  const recentActivity = prepare(`
    SELECT r.id, r.amount, r.type, r.category, r.date, r.notes, u.name as created_by_name
    FROM financial_records r JOIN users u ON r.created_by = u.id
    WHERE r.is_deleted = 0 ORDER BY r.date DESC, r.created_at DESC LIMIT 10
  `).all();

  res.json({
    summary: {
      totalIncome: totals.total_income,
      totalExpense: totals.total_expense,
      netBalance: totals.total_income - totals.total_expense,
      totalTransactions: totals.total_transactions
    },
    categoryBreakdown,
    recentActivity
  });
}

function getMonthlyTrends(req, res) {
  const { year = new Date().getFullYear() } = req.query;

  const monthly = prepare(`
    SELECT
      strftime('%Y-%m', date) as month,
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense,
      COUNT(*) as transactions
    FROM financial_records
    WHERE is_deleted = 0 AND strftime('%Y', date) = ?
    GROUP BY strftime('%Y-%m', date) ORDER BY month ASC
  `).all(String(year));

  res.json({ year: parseInt(year), trends: monthly.map(m => ({ ...m, net: m.income - m.expense })) });
}

function getWeeklyTrends(req, res) {
  const weekly = prepare(`
    SELECT
      strftime('%Y-W%W', date) as week,
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense,
      COUNT(*) as transactions
    FROM financial_records
    WHERE is_deleted = 0 AND date >= date('now', '-12 weeks')
    GROUP BY strftime('%Y-W%W', date) ORDER BY week ASC
  `).all();

  res.json({ trends: weekly.map(w => ({ ...w, net: w.income - w.expense })) });
}

function getCategoryInsights(req, res) {
  const { type } = req.query;
  let typeFilter = 'AND is_deleted = 0';
  const params = [];

  if (type) { typeFilter += ' AND type = ?'; params.push(type); }

  const categories = prepare(`
    SELECT category, type, COUNT(*) as transaction_count,
           ROUND(SUM(amount), 2) as total_amount,
           ROUND(AVG(amount), 2) as avg_amount,
           ROUND(MIN(amount), 2) as min_amount,
           ROUND(MAX(amount), 2) as max_amount
    FROM financial_records WHERE 1=1 ${typeFilter}
    GROUP BY category, type ORDER BY total_amount DESC
  `).all(...params);

  res.json({ categories });
}

module.exports = { getSummary, getMonthlyTrends, getWeeklyTrends, getCategoryInsights };
