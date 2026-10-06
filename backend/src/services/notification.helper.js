// backend/src/services/notification.helper.js
import prisma from '../config/prisma.js';
import { sseService } from './sse.service.js';
import { pushService } from './push.service.js';

export async function createAndPushNotification(tx, params) {
  const client = tx || prisma;

  let notif = null;

  // ⭐ CHỈ tạo notification record khi có userId cụ thể
  // (broadcast thì không tạo record — chỉ gửi push)
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

  // ⭐ Push bất đồng bộ — không block request
  setImmediate(async () => {
    // 1. SSE cho user cụ thể
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

    // 2. Web Push
    try {
      if (params.broadcast) {
        // ⭐ Broadcast cho TẤT CẢ (user + khách)
        const result = await pushService.broadcast({
          title: notif?.title || params.title,
          content: notif?.content || params.content,
          dispatchId: params.dispatchId,
          notificationId: notif?.id,
          url: params.url || (params.dispatchId ? `/dispatches/${params.dispatchId}` : '/'),
        });
        console.log(`📢 [PUSH] Broadcast done:`, result);
      } else if (params.userId) {
        // Gửi cho 1 user cụ thể (tất cả thiết bị của user đó)
        const result = await pushService.sendToUser(params.userId, {
          title: notif?.title || params.title,
          content: notif?.content || params.content,
          dispatchId: params.dispatchId,
          notificationId: notif?.id,
          url: params.url || (params.dispatchId ? `/dispatches/${params.dispatchId}` : '/'),
        });
        console.log(`📤 [PUSH] Sent to user ${params.userId}:`, result);
      }
    } catch (err) {
      console.error('❌ Web Push lỗi:', err.message);
    }
  });

  return notif;
}