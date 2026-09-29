// backend/src/routes/users.routes.js
import express from 'express';
import { usersController } from '../controllers/users.controller.js';
import { authenticate, optionalAuth } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permission.js';
import {
  validateCreateUser,
  validateUpdateUser,
  validateResetPassword,
} from '../middlewares/validate.js';

const router = express.Router();

// ⚠️ KHÔNG dùng router.use(authenticate)

// ============================================
// GET /api/users — CHO PHÉP KHÁCH
// ============================================
router.get(
  '/',
  optionalAuth,
  usersController.getUsers
);

// ============================================
// GET /api/users/:id — CHO PHÉP KHÁCH
// ============================================
router.get(
  '/:id',
  optionalAuth,
  usersController.getUserById
);

// ============================================
// POST /api/users — CẦN LOGIN
// ============================================
router.post(
  '/',
  authenticate,
  requirePermission('user:create'),
  validateCreateUser,
  usersController.createUser
);

// ============================================
// PUT /api/users/:id — CẦN LOGIN
// ============================================
router.put(
  '/:id',
  authenticate,
  requirePermission('user:update:all', 'user:update:own'),
  validateUpdateUser,
  usersController.updateUser
);

// ============================================
// DELETE /api/users/:id — CẦN LOGIN
// ============================================
router.delete(
  '/:id',
  authenticate,
  requirePermission('user:delete'),
  usersController.deleteUser
);

// ============================================
// PUT /api/users/:id/roles — CẦN LOGIN
// ============================================
router.put(
  '/:id/roles',
  authenticate,
  requirePermission('user:assign-role'),
  usersController.assignRoles
);

// ============================================
// POST /api/users/:id/reset-password — CẦN LOGIN
// ============================================
router.post(
  '/:id/reset-password',
  authenticate,
  requirePermission('user:reset-password'),
  validateResetPassword,
  usersController.resetPassword
);

// ============================================
// PATCH /api/users/:id/toggle-active — CẦN LOGIN
// ============================================
router.patch(
  '/:id/toggle-active',
  authenticate,
  requirePermission('user:update:all'),
  usersController.toggleActive
);

export default router;