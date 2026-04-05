const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { prepare } = require('../database');
const { JWT_SECRET } = require('../middleware/auth');

async function register(req, res) {
  const { name, email, password, role = 'viewer' } = req.body;

  const existing = prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const passwordHash = await bcrypt.hash(password, 12);
  const id = uuidv4();

  prepare('INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)').run(id, name, email, passwordHash, role);

  const user = prepare('SELECT id, name, email, role, status, created_at FROM users WHERE id = ?').get(id);
  res.status(201).json({ message: 'Account created successfully', user });
}

async function login(req, res) {
  const { email, password } = req.body;

  const user = prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });
  if (user.status === 'inactive') return res.status(403).json({ error: 'Account is inactive. Contact an administrator.' });

  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) return res.status(401).json({ error: 'Invalid email or password' });

  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

  res.json({
    message: 'Login successful',
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
}

function getMe(req, res) {
  res.json({ user: req.user });
}

module.exports = { register, login, getMe };
