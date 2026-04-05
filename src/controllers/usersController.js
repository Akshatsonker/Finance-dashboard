const { prepare } = require('../database');

function getAllUsers(req, res) {
  const users = prepare('SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC').all();
  res.json({ users, total: users.length });
}

function getUserById(req, res) {
  const user = prepare('SELECT id, name, email, role, status, created_at FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
}

function updateUser(req, res) {
  const { id } = req.params;
  const { name, role, status } = req.body;

  if (id === req.user.id && status === 'inactive') {
    return res.status(400).json({ error: 'You cannot deactivate your own account' });
  }

  const user = prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  prepare(`UPDATE users SET name = ?, role = ?, status = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(name ?? user.name, role ?? user.role, status ?? user.status, id);

  const updated = prepare('SELECT id, name, email, role, status, created_at, updated_at FROM users WHERE id = ?').get(id);
  res.json({ message: 'User updated', user: updated });
}

function deleteUser(req, res) {
  const { id } = req.params;
  if (id === req.user.id) return res.status(400).json({ error: 'You cannot delete your own account' });

  const user = prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ message: 'User deleted successfully' });
}

module.exports = { getAllUsers, getUserById, updateUser, deleteUser };
