const { v4: uuidv4 } = require('uuid');
const { prepare } = require('../database');

function getRecords(req, res) {
  const { type, category, from, to, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const conditions = ['r.is_deleted = 0'];
  const params = [];

  if (type)     { conditions.push('r.type = ?');                params.push(type); }
  if (category) { conditions.push('LOWER(r.category) LIKE ?'); params.push(`%${category.toLowerCase()}%`); }
  if (from)     { conditions.push('r.date >= ?');              params.push(from); }
  if (to)       { conditions.push('r.date <= ?');              params.push(to); }

  const where = `WHERE ${conditions.join(' AND ')}`;

  const countRow = prepare(`SELECT COUNT(*) as total FROM financial_records r ${where}`).get(...params);
  const total = countRow ? countRow.total : 0;

  const records = prepare(`
    SELECT r.id, r.amount, r.type, r.category, r.date, r.notes,
           r.created_at, u.name as created_by_name
    FROM financial_records r
    JOIN users u ON r.created_by = u.id
    ${where}
    ORDER BY r.date DESC, r.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  res.json({ records, pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) } });
}

function getRecordById(req, res) {
  const record = prepare(`
    SELECT r.id, r.amount, r.type, r.category, r.date, r.notes,
           r.created_at, r.updated_at, u.name as created_by_name
    FROM financial_records r
    JOIN users u ON r.created_by = u.id
    WHERE r.id = ? AND r.is_deleted = 0
  `).get(req.params.id);

  if (!record) return res.status(404).json({ error: 'Record not found' });
  res.json({ record });
}

function createRecord(req, res) {
  const { amount, type, category, date, notes } = req.body;
  const id = uuidv4();

  prepare('INSERT INTO financial_records (id, amount, type, category, date, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, parseFloat(amount), type, category.trim(), date, notes || null, req.user.id);

  const record = prepare(`
    SELECT r.id, r.amount, r.type, r.category, r.date, r.notes, r.created_at, u.name as created_by_name
    FROM financial_records r JOIN users u ON r.created_by = u.id WHERE r.id = ?
  `).get(id);

  res.status(201).json({ message: 'Record created', record });
}

function updateRecord(req, res) {
  const { id } = req.params;
  const { amount, type, category, date, notes } = req.body;

  const record = prepare('SELECT * FROM financial_records WHERE id = ? AND is_deleted = 0').get(id);
  if (!record) return res.status(404).json({ error: 'Record not found' });

  prepare(`UPDATE financial_records SET amount = ?, type = ?, category = ?, date = ?, notes = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(
      amount !== undefined ? parseFloat(amount) : record.amount,
      type ?? record.type,
      category !== undefined ? category.trim() : record.category,
      date ?? record.date,
      notes !== undefined ? notes : record.notes,
      id
    );

  const updated = prepare(`
    SELECT r.id, r.amount, r.type, r.category, r.date, r.notes, r.created_at, r.updated_at, u.name as created_by_name
    FROM financial_records r JOIN users u ON r.created_by = u.id WHERE r.id = ?
  `).get(id);

  res.json({ message: 'Record updated', record: updated });
}

function deleteRecord(req, res) {
  const { id } = req.params;
  const record = prepare('SELECT id FROM financial_records WHERE id = ? AND is_deleted = 0').get(id);
  if (!record) return res.status(404).json({ error: 'Record not found' });

  prepare(`UPDATE financial_records SET is_deleted = 1, deleted_at = datetime('now') WHERE id = ?`).run(id);
  res.json({ message: 'Record deleted successfully' });
}

module.exports = { getRecords, getRecordById, createRecord, updateRecord, deleteRecord };
