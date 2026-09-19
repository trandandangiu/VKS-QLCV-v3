// backend/src/routes/departments.routes.js
import express from 'express';
import { departmentsController } from '../controllers/departments.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permission.js';

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /api/departments:
 *   get:
 *     tags: [Departments]
 *     summary: Danh sách phòng ban
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 departments:
 *                   - id: uuid
 *                     code: TP1
 *                     name: Phòng 1 (Án an ninh)
 *                     manager:
 *                       fullName: Trưởng phòng 1
 *                     pvtManager:
 *                       fullName: Phó Viện trưởng 1
 */
router.get('/', departmentsController.getDepartments);

/**
 * @swagger
 * /api/departments/{id}:
 *   get:
 *     tags: [Departments]
 *     summary: Chi tiết phòng ban
 */
router.get('/:id', departmentsController.getDepartmentById);

/**
 * @swagger
 * /api/departments:
 *   post:
 *     tags: [Departments]
 *     summary: Tạo phòng ban
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               managerId:
 *                 type: string
 *               pvtManagerId:
 *                 type: string
 *     responses:
 *       201:
 *         description: OK
 */
router.post(
  '/',
  requirePermission('user:create'),
  departmentsController.createDepartment
);

/**
 * @swagger
 * /api/departments/{id}:
 *   put:
 *     summary: Cập nhật phòng ban
 *     tags: [Departments]
 */
router.put(
  '/:id',
  requirePermission('user:update:all'),
  departmentsController.updateDepartment
);

/**
 * @swagger
 * /api/departments/{id}: 
 * tags: [Departments]
 *   delete:
 *     summary: Xóa phòng ban
 */
router.delete(
  '/:id',
  requirePermission('user:delete'),
  departmentsController.deleteDepartment
);

export default router;