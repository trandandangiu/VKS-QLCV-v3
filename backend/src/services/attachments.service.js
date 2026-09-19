// backend/src/services/attachments.service.js
import prisma from '../config/prisma.js';
import fs from 'fs';
import path from 'path';

export const attachmentsService = {
  // ============================================
  // 1. UPLOAD FILE
  // ============================================
  async uploadAttachment(dispatchId, file, data, currentUser) {
    const { fileCategory = 'OTHER', description } = data;

    if (!file) {
      throw { status: 400, message: 'Chưa chọn file' };
    }

    // Check dispatch tồn tại
    const dispatch = await prisma.dispatch.findUnique({
      where: { id: dispatchId },
    });

    if (!dispatch || dispatch.deletedAt) {
      throw { status: 404, message: 'Không tìm thấy công văn' };
    }

    // Tạo record trong DB
    const attachment = await prisma.attachment.create({
      data: {
        dispatchId,
        uploaderId: currentUser.id,
        uploaderName: currentUser.fullName,
        uploaderRole: currentUser.roles?.[0] || 'USER',
        fileName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        fileType: file.mimetype,
        fileCategory,
        description: description || null,
      },
    });

    // Audit
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: 'UPLOAD_ATTACHMENT',
        entityType: 'attachment',
        entityId: attachment.id,
        newValue: { fileName: file.originalname },
      },
    });

    // Return attachment info (không lộ filePath)
    return {
      id: attachment.id,
      fileName: attachment.fileName,
      fileSize: attachment.fileSize,
      fileType: attachment.fileType,
      fileCategory: attachment.fileCategory,
      description: attachment.description,
      uploaderName: attachment.uploaderName,
      createdAt: attachment.createdAt,
    };
  },

  // ============================================
  // 2. LẤY DANH SÁCH FILE CỦA CÔNG VĂN
  // ============================================
  async getAttachments(dispatchId, currentUser) {
    // Check dispatch tồn tại
    const dispatch = await prisma.dispatch.findUnique({
      where: { id: dispatchId },
    });

    if (!dispatch || dispatch.deletedAt) {
      throw { status: 404, message: 'Không tìm thấy công văn' };
    }

    const attachments = await prisma.attachment.findMany({
      where: {
        dispatchId,
        isDeleted: false,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        fileType: true,
        fileCategory: true,
        description: true,
        uploaderId: true,
        uploaderName: true,
        uploaderRole: true,
        createdAt: true,
      },
    });

    return { attachments };
  },

  // ============================================
  // 3. DOWNLOAD FILE
  // ============================================
  async getAttachmentForDownload(attachmentId, currentUser) {
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: {
        dispatch: true,
      },
    });

    if (!attachment || attachment.isDeleted) {
      throw { status: 404, message: 'Không tìm thấy file' };
    }

    // Check file tồn tại trên disk
    if (!fs.existsSync(attachment.filePath)) {
      throw { status: 404, message: 'File không tồn tại trên server' };
    }

    return attachment;
  },

  // ============================================
  // 4. XÓA FILE (SOFT DELETE)
  // ============================================
  async deleteAttachment(attachmentId, currentUser) {
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment || attachment.isDeleted) {
      throw { status: 404, message: 'Không tìm thấy file' };
    }

    // Check quyền xóa
    const perms = currentUser.permissions || [];
    const isOwner = attachment.uploaderId === currentUser.id;
    const canDeleteAll = perms.includes('attachment:delete:all') 
                      || perms.includes('user:delete');

    if (!isOwner && !canDeleteAll) {
      throw { status: 403, message: 'Không có quyền xóa file này' };
    }

    // Soft delete
    await prisma.attachment.update({
      where: { id: attachmentId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    // Audit
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: 'DELETE_ATTACHMENT',
        entityType: 'attachment',
        entityId: attachmentId,
      },
    });

    return { success: true, message: 'Đã xóa file' };
  },
};