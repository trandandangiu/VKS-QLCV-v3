// backend/src/routes/attachments.routes.js
import express from 'express';
import { attachmentsController } from '../controllers/attachments.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { upload } from '../config/multer.js';

const router = express.Router();

router.use(authenticate);

// ============================================
// UPLOAD — POST /api/dispatches/:id/attachments
// ============================================
/**
 * @swagger
 * /api/dispatches/{id}/attachments:
 *   post:
 *     tags: [Attachments]
 *     summary: Upload file đính kèm cho công văn
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               fileCategory:
 *                 type: string
 *                 enum: [ORIGINAL, DRAFT, REPORT, APPROVAL, REJECTION, OTHER]
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Upload thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: Upload file thành công
 *                 attachment:
 *                   id: att-xxx
 *                   fileName: baocao.pdf
 *                   fileSize: 1024000
 *                   fileType: application/pdf
 *                   uploaderName: Admin
 */
router.post(
  '/dispatches/:id/attachments',
  upload.single('file'),
  attachmentsController.uploadAttachment
);

// ============================================
// LIST — GET /api/dispatches/:id/attachments
// ============================================
/**
 * @swagger
 * /api/dispatches/{id}/attachments:
 *   get:
 *     tags: [Attachments]
 *     summary: Danh sách file đính kèm
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 attachments:
 *                   - id: att-xxx
 *                     fileName: baocao.pdf
 *                     fileSize: 1024000
 *                     uploaderName: Admin
 */
router.get(
  '/dispatches/:id/attachments',
  attachmentsController.getAttachments
);

// ============================================
// DOWNLOAD — GET /api/attachments/:id/download
// ============================================
/**
 * @swagger
 * /api/attachments/{id}/download:
 *   get:
 *     tags: [Attachments]
 *     summary: Download file
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File binary
 */
router.get(
  '/attachments/:id/download',
  attachmentsController.downloadAttachment
);

// ============================================
// DELETE — DELETE /api/attachments/:id
// ============================================
/**
 * @swagger
 * /api/attachments/{id}:
 *   delete:
 *     tags: [Attachments]
 *     summary: Xóa file (mềm)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.delete(
  '/attachments/:id',
  attachmentsController.deleteAttachment
);

export default router;