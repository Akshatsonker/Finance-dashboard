const express = require('express');
const rateLimit = require('express-rate-limit');

const { authenticate, authorize } = require('../middleware/auth');
const {
  registerValidators, loginValidators,
  createRecordValidators, updateRecordValidators,
  recordFilterValidators, updateUserValidators
} = require('../middleware/validators');

const authController = require('../controllers/authController');
const usersController = require('../controllers/usersController');
const recordsController = require('../controllers/recordsController');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' }
});

// ─── AUTH ROUTES ──────────────────────────────────────────────────────────────
// POST /api/auth/register - Create a new account (admin can create any role)
router.post('/auth/register', authLimiter, registerValidators, authController.register);

// POST /api/auth/login - Get JWT token
router.post('/auth/login', authLimiter, loginValidators, authController.login);

// GET /api/auth/me - Get current user profile
router.get('/auth/me', authenticate, authController.getMe);

// ─── USER MANAGEMENT (ADMIN ONLY) ─────────────────────────────────────────────
// GET /api/users - List all users
router.get('/users', authenticate, authorize('admin'), usersController.getAllUsers);

// GET /api/users/:id - Get a specific user
router.get('/users/:id', authenticate, authorize('admin'), usersController.getUserById);

// PATCH /api/users/:id - Update user role/status/name
router.patch('/users/:id', authenticate, authorize('admin'), updateUserValidators, usersController.updateUser);

// DELETE /api/users/:id - Remove a user
router.delete('/users/:id', authenticate, authorize('admin'), usersController.deleteUser);

// ─── FINANCIAL RECORDS ────────────────────────────────────────────────────────
// GET /api/records - List records with filters (viewer, analyst, admin)
router.get('/records', authenticate, recordFilterValidators, recordsController.getRecords);

// GET /api/records/:id - Get a single record (viewer, analyst, admin)
router.get('/records/:id', authenticate, recordsController.getRecordById);

// POST /api/records - Create a new record (analyst, admin)
router.post('/records', authenticate, authorize('analyst', 'admin'), createRecordValidators, recordsController.createRecord);

// PATCH /api/records/:id - Update a record (analyst, admin)
router.patch('/records/:id', authenticate, authorize('analyst', 'admin'), updateRecordValidators, recordsController.updateRecord);

// DELETE /api/records/:id - Soft-delete a record (admin only)
router.delete('/records/:id', authenticate, authorize('admin'), recordsController.deleteRecord);

// ─── DASHBOARD / ANALYTICS ────────────────────────────────────────────────────
// GET /api/dashboard/summary - Overview stats (analyst, admin)
router.get('/dashboard/summary', authenticate, authorize('analyst', 'admin'), dashboardController.getSummary);

// GET /api/dashboard/trends/monthly - Monthly income vs expense (analyst, admin)
router.get('/dashboard/trends/monthly', authenticate, authorize('analyst', 'admin'), dashboardController.getMonthlyTrends);

// GET /api/dashboard/trends/weekly - Last 12 weeks (analyst, admin)
router.get('/dashboard/trends/weekly', authenticate, authorize('analyst', 'admin'), dashboardController.getWeeklyTrends);

// GET /api/dashboard/categories - Category insights (analyst, admin)
router.get('/dashboard/categories', authenticate, authorize('analyst', 'admin'), dashboardController.getCategoryInsights);

module.exports = router;
