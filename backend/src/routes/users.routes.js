// backend/src/routes/users.routes.js
import express from 'express';
import { usersController } from '../controllers/users.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permission.js';
import {
  validateCreateUser,
  validateUpdateUser,
  validateResetPassword,
} from '../middlewares/validate.js';

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Lấy danh sách users
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Số item/trang
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm theo username, fullName, email, phone
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [ADMIN, VIEN_TRUONG, PHO_VIEN_TRUONG, TRUONG_PHONG]
 *         description: Lọc theo role
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *         description: Lọc theo phòng ban
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Lọc theo trạng thái
 *     responses:
 *       200:
 *         description: Danh sách users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get(
  '/',
  requirePermission('user:view:all', 'user:view:department', 'user:view:own'),
  usersController.getUsers
);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Lấy chi tiết user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID user
 *     responses:
 *       200:
 *         description: Chi tiết user
 *       404:
 *         description: Không tìm thấy user
 */
router.get(
  '/:id',
  requirePermission('user:view:all', 'user:view:department', 'user:view:own'),
  usersController.getUserById
);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Tạo tài khoản mới
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - fullName
 *               - roleIds
 *             properties:
 *               username:
 *                 type: string
 *                 example: test_user
 *               password:
 *                 type: string
 *                 description: Nếu không nhập, mặc định là "vks@2026"
 *                 example: vks@2026
 *               fullName:
 *                 type: string
 *                 example: Nguyễn Văn Test
 *               email:
 *                 type: string
 *                 example: test@vks.gov.vn
 *               phone:
 *                 type: string
 *                 example: '0901234567'
 *               position:
 *                 type: string
 *                 example: Chuyên viên
 *               departmentId:
 *                 type: string
 *                 description: Bắt buộc nếu có role TRUONG_PHONG
 *               managerId:
 *                 type: string
 *               roleIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [3]
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.post(
  '/',
  requirePermission('user:create'),
  validateCreateUser,
  usersController.createUser
);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Cập nhật user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               position:
 *                 type: string
 *               departmentId:
 *                 type: string
 *               managerId:
 *                 type: string
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy user
 */
router.put(
  '/:id',
  requirePermission('user:update:all', 'user:update:own'),
  validateUpdateUser,
  usersController.updateUser
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Xóa mềm user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       400:
 *         description: Không thể xóa chính mình hoặc admin
 */
router.delete(
  '/:id',
  requirePermission('user:delete'),
  usersController.deleteUser
);

/**
 * @swagger
 * /api/users/{id}/roles:
 *   put:
 *     summary: Gán roles cho user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleIds
 *             properties:
 *               roleIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [3, 4]
 *     responses:
 *       200:
 *         description: Gán roles thành công
 */
router.put(
  '/:id/roles',
  requirePermission('user:assign-role'),
  usersController.assignRoles
);

/**
 * @swagger
 * /api/users/{id}/reset-password:
 *   post:
 *     summary: Reset mật khẩu user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newPassword:
 *                 type: string
 *                 description: Nếu không nhập, mặc định là "vks@2026"
 *                 example: newpass123
 *     responses:
 *       200:
 *         description: Reset thành công
 */
router.post(
  '/:id/reset-password',
  requirePermission('user:reset-password'),
  validateResetPassword,
  usersController.resetPassword
);

/**
 * @swagger
 * /api/users/{id}/toggle-active:
 *   patch:
 *     summary: Khóa/mở khóa user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.patch(
  '/:id/toggle-active',
  requirePermission('user:update:all'),
  usersController.toggleActive
);

export default router;