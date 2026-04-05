const { initDb, initializeDatabase, prepare, transaction } = require('./database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const PORT = process.env.PORT || 3001;

async function seedDemoData() {
  const row = prepare('SELECT COUNT(*) as count FROM users').get();
  if (row && row.count > 0) return;

  console.log('Seeding demo users and records...');

  const adminId = uuidv4(), analystId = uuidv4(), viewerId = uuidv4();

  prepare('INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)')
    .run(adminId,   'Alice Admin',   'admin@demo.com',   await bcrypt.hash('admin123',   12), 'admin');
  prepare('INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)')
    .run(analystId, 'Bob Analyst',   'analyst@demo.com', await bcrypt.hash('analyst123', 12), 'analyst');
  prepare('INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)')
    .run(viewerId,  'Carol Viewer',  'viewer@demo.com',  await bcrypt.hash('viewer123',  12), 'viewer');

  const sampleRecords = [
    [uuidv4(), 85000, 'income',  'Salary',         '2025-01-05', 'Monthly salary',              adminId],
    [uuidv4(), 12000, 'income',  'Freelance',       '2025-01-15', 'Website project',             analystId],
    [uuidv4(),  4500, 'expense', 'Rent',            '2025-01-01', 'January rent',                adminId],
    [uuidv4(),  2200, 'expense', 'Utilities',       '2025-01-10', 'Electricity & water',         adminId],
    [uuidv4(),  8500, 'expense', 'Software',        '2025-01-20', 'Annual SaaS subscriptions',   analystId],
    [uuidv4(), 85000, 'income',  'Salary',          '2025-02-05', 'Monthly salary',              adminId],
    [uuidv4(),  5000, 'income',  'Freelance',       '2025-02-18', 'Logo design',                 analystId],
    [uuidv4(),  4500, 'expense', 'Rent',            '2025-02-01', 'February rent',               adminId],
    [uuidv4(),  3200, 'expense', 'Marketing',       '2025-02-12', 'Paid ads campaign',           analystId],
    [uuidv4(),  1800, 'expense', 'Office Supplies', '2025-02-25', 'Stationery and equipment',    adminId],
    [uuidv4(), 85000, 'income',  'Salary',          '2025-03-05', 'Monthly salary',              adminId],
    [uuidv4(), 18000, 'income',  'Consulting',      '2025-03-22', 'Q1 consulting retainer',      analystId],
    [uuidv4(),  4500, 'expense', 'Rent',            '2025-03-01', 'March rent',                  adminId],
    [uuidv4(),  6500, 'expense', 'Travel',          '2025-03-14', 'Client visit expenses',       analystId],
    [uuidv4(),  2100, 'expense', 'Utilities',       '2025-03-10', 'March utilities',             adminId],
  ];

  const insertFn = transaction((records) => {
    for (const r of records) {
      prepare('INSERT INTO financial_records (id, amount, type, category, date, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(...r);
    }
  });
  insertFn(sampleRecords);

  console.log('Demo data seeded!');
  console.log('  Admin:    admin@demo.com   / admin123');
  console.log('  Analyst:  analyst@demo.com / analyst123');
  console.log('  Viewer:   viewer@demo.com  / viewer123');
}

async function start() {
  // 1. Init DB first (sql.js is async)
  await initDb();
  // 2. Create tables
  initializeDatabase();
  // 3. Seed demo data
  await seedDemoData();

  // 4. Load app AFTER db is ready (controllers use prepare() at call-time, not import-time)
  const app = require('./app');

  app.listen(PORT, () => {
    console.log(`\nFinance Dashboard API running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health\n`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
