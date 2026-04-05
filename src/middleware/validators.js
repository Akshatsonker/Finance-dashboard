const { body, query, param, validationResult } = require('express-validator');

// Middleware to handle validation errors uniformly
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
}

// Auth validators
const registerValidators = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['viewer', 'analyst', 'admin']).withMessage('Invalid role'),
  handleValidationErrors
];

const loginValidators = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

// Financial record validators
const createRecordValidators = [
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('category').trim().notEmpty().withMessage('Category is required').isLength({ max: 50 }),
  body('date').isISO8601().withMessage('Date must be a valid ISO 8601 date (YYYY-MM-DD)'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes must be under 500 chars'),
  handleValidationErrors
];

const updateRecordValidators = [
  param('id').notEmpty().withMessage('Record ID is required'),
  body('amount').optional().isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
  body('type').optional().isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('category').optional().trim().notEmpty().isLength({ max: 50 }),
  body('date').optional().isISO8601().withMessage('Date must be a valid ISO 8601 date'),
  body('notes').optional().trim().isLength({ max: 500 }),
  handleValidationErrors
];

// Query filter validators
const recordFilterValidators = [
  query('type').optional().isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  query('category').optional().trim(),
  query('from').optional().isISO8601().withMessage('from must be a valid date'),
  query('to').optional().isISO8601().withMessage('to must be a valid date'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

// User management validators
const updateUserValidators = [
  param('id').notEmpty(),
  body('role').optional().isIn(['viewer', 'analyst', 'admin']).withMessage('Invalid role'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
  body('name').optional().trim().notEmpty().isLength({ max: 100 }),
  handleValidationErrors
];

module.exports = {
  registerValidators,
  loginValidators,
  createRecordValidators,
  updateRecordValidators,
  recordFilterValidators,
  updateUserValidators
};
