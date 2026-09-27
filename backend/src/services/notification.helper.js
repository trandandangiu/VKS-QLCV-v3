// backend/src/services/notification.helper.js
import prisma from '../config/prisma.js';
import { sseService } from './sse.service.js';
import { pushService } from './push.service.js';

/**
 * Tạo notification + push realtime (SSE + Web Push)
 *
 * @param tx - Prisma transaction (nullable)
 * @param params:
 *   - userId?: string        → gửi cho 1 user (optional)
 *   - broadcast?: boolean    → gửi cho TẤT CẢ (user + khách)
 *   - dispatchId?: string
 *   - type: string
 *   - title: string
 *   - content?: string
 *   - url?: string           → deep link khi click notification
 */
export async function createAndPushNotification(tx, params) {
  const client = tx || prisma;

  // ⭐ 1. Lưu DB — CHỈ lưu nếu có userId
  // (khách không có DB record vì bảng notification cần userId)
  let notif = null;
  if (params.userId) {
    notif = await client.notification.create({
      data: {
        userId: params.userId,
        dispatchId: params.dispatchId || null,
        type: params.type,
        title: params.title,
        content: params.content || null,
        referenceType: params.referenceType || null,
        referenceId: params.referenceId || null,
      },
    });
  }

  // ⭐ 2. Push realtime — chạy SAU khi transaction commit
  setImmediate(async () => {
    // 2a. SSE — CHỈ gửi nếu có userId (khách không có SSE connection)
    if (params.userId && notif) {
      try {
        sseService.sendToUser(params.userId, 'notification', {
          id: notif.id,
          type: notif.type,
          title: notif.title,
          content: notif.content,
          dispatchId: notif.dispatchId,
          isRead: false,
          createdAt: notif.createdAt,
        });
      } catch (err) {
        console.error('❌ SSE push lỗi:', err.message);
      }
    }

    // 2b. Web Push
    try {
      if (params.broadcast) {
        // ⭐ BROADCAST — gửi cho TẤT CẢ user + khách
        await pushService.broadcast({
          title: notif?.title || params.title,
          content: notif?.content || params.content,
          dispatchId: params.dispatchId,
          notificationId: notif?.id,
          url: params.url || '/',
        });
      } else if (params.userId) {
        // Gửi cho 1 user cụ thể (tất cả thiết bị của user đó)
        await pushService.sendToUser(params.userId, {
          title: notif?.title || params.title,
          content: notif?.content || params.content,
          dispatchId: params.dispatchId,
          notificationId: notif?.id,
          url: params.url || '/',
        });
      }
    } catch (err) {
      console.error('❌ Web Push lỗi:', err.message);
    }
  });

  return notif;
}