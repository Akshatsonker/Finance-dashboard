const request = require('supertest');
const path = require('path');

process.env.DB_PATH = path.join(__dirname, '../data/test.db');

const { initDb, initializeDatabase, prepare } = require('../src/database');
let app;

let adminToken, analystToken, viewerToken;
let recordId;

beforeAll(async () => {
  await initDb();
  initializeDatabase();

  // Clean test DB
  try { prepare('DELETE FROM financial_records').run(); } catch(e) {}
  try { prepare('DELETE FROM users').run(); } catch(e) {}

  app = require('../src/app');

  await request(app).post('/api/auth/register').send({ name: 'Test Admin',   email: 'testadmin@test.com',   password: 'pass123', role: 'admin' });
  await request(app).post('/api/auth/register').send({ name: 'Test Analyst', email: 'testanalyst@test.com', password: 'pass123', role: 'analyst' });
  await request(app).post('/api/auth/register').send({ name: 'Test Viewer',  email: 'testviewer@test.com',  password: 'pass123', role: 'viewer' });

  adminToken   = (await request(app).post('/api/auth/login').send({ email: 'testadmin@test.com',   password: 'pass123' })).body.token;
  analystToken = (await request(app).post('/api/auth/login').send({ email: 'testanalyst@test.com', password: 'pass123' })).body.token;
  viewerToken  = (await request(app).post('/api/auth/login').send({ email: 'testviewer@test.com',  password: 'pass123' })).body.token;
});

describe('Authentication', () => {
  test('registers a new user', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'New User', email: 'newuser@test.com', password: 'pass123' });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('viewer');
  });

  test('rejects duplicate email', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Dup', email: 'testadmin@test.com', password: 'pass123' });
    expect(res.status).toBe(409);
  });

  test('logs in with valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'testadmin@test.com', password: 'pass123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('rejects wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'testadmin@test.com', password: 'wrongpass' });
    expect(res.status).toBe(401);
  });

  test('returns current user profile', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('testadmin@test.com');
  });
});

describe('Financial Records', () => {
  test('analyst can create a record', async () => {
    const res = await request(app).post('/api/records').set('Authorization', `Bearer ${analystToken}`)
      .send({ amount: 5000, type: 'income', category: 'Salary', date: '2025-03-01' });
    expect(res.status).toBe(201);
    recordId = res.body.record.id;
  });

  test('viewer cannot create a record', async () => {
    const res = await request(app).post('/api/records').set('Authorization', `Bearer ${viewerToken}`)
      .send({ amount: 100, type: 'expense', category: 'Food', date: '2025-03-01' });
    expect(res.status).toBe(403);
  });

  test('all roles can view records', async () => {
    const res = await request(app).get('/api/records').set('Authorization', `Bearer ${viewerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.records).toBeDefined();
  });

  test('can filter records by type', async () => {
    const res = await request(app).get('/api/records?type=income').set('Authorization', `Bearer ${viewerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.records.every(r => r.type === 'income')).toBe(true);
  });

  test('rejects invalid record data', async () => {
    const res = await request(app).post('/api/records').set('Authorization', `Bearer ${analystToken}`)
      .send({ amount: -100, type: 'wrong', category: '', date: 'not-a-date' });
    expect(res.status).toBe(400);
    expect(res.body.details).toBeDefined();
  });

  test('viewer cannot delete a record', async () => {
    const res = await request(app).delete(`/api/records/${recordId}`).set('Authorization', `Bearer ${viewerToken}`);
    expect(res.status).toBe(403);
  });

  test('admin can delete a record', async () => {
    const res = await request(app).delete(`/api/records/${recordId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});

describe('Dashboard', () => {
  test('analyst can access summary', async () => {
    const res = await request(app).get('/api/dashboard/summary').set('Authorization', `Bearer ${analystToken}`);
    expect(res.status).toBe(200);
    expect(res.body.summary).toHaveProperty('totalIncome');
  });

  test('viewer cannot access dashboard', async () => {
    const res = await request(app).get('/api/dashboard/summary').set('Authorization', `Bearer ${viewerToken}`);
    expect(res.status).toBe(403);
  });

  test('monthly trends return correct shape', async () => {
    const res = await request(app).get('/api/dashboard/trends/monthly').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.trends)).toBe(true);
  });
});
