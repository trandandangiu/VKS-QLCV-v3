// backend/src/services/notification.helper.js
import prisma from '../config/prisma.js';
import { sseService } from './sse.service.js';
import { pushService } from './push.service.js';

export async function createAndPushNotification(tx, params) {
  const client = tx || prisma;

  let notif = null;
  if (params.userId) {
    notif = await client.notification.create({
      data: {
        userId: params.userId,
        dispatchId: params.dispatchId || null,
        type: params.type,
        title: params.title || 'Có thông báo mới',
        content: null,
        referenceType: params.referenceType || null,
        referenceId: params.referenceId || null,
      },
    });
  }

  setImmediate(async () => {
    if (params.userId && notif) {
      try {
        sseService.sendToUser(params.userId, 'notification', {
          id: notif.id,
          type: notif.type,
          title: notif.title,
          content: null,
          dispatchId: notif.dispatchId,
          isRead: false,
          createdAt: notif.createdAt,
        });
      } catch (err) {
        console.error('❌ SSE push lỗi:', err.message);
      }
    }

    try {
      // ⭐ Title CỐ ĐỊNH cho mọi push notification
      const pushPayload = {
        title: 'Có thông báo mới',
        content: '',
        dispatchId: params.dispatchId,
        notificationId: notif?.id,
        url: params.dispatchId ? `/dispatches/${params.dispatchId}` : '/',
      };

      if (params.broadcast) {
        await pushService.broadcast(pushPayload);
      } else if (params.userId) {
        await pushService.sendToUser(params.userId, pushPayload);
      }
    } catch (err) {
      console.error('❌ Web Push lỗi:', err.message);
    }
  });

  return notif;
}
