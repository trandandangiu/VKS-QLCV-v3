// frontend/src/hooks/useNotifications.ts
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/apiClient';
import { useSSE } from './useSSE';

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  content?: string;
  dispatchId?: string;
  isRead: boolean;
  createdAt: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotification, setLatestNotification] = useState<NotificationItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load ban đầu
  const loadInitial = useCallback(async () => {
    try {
      setIsLoading(true);
      const list = await apiClient.getNotifications({ page: 1 });
      setNotifications(list || []);
      const count = await apiClient.getUnreadCount();
      setUnreadCount(count || 0);
    } catch (err) {
      console.error('Lỗi load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // ⭐ SSE — nhận realtime
  const { isConnected } = useSSE({
    enabled: true,
    onNotification: (notif: NotificationItem) => {
      console.log('🔔 Nhận notification realtime:', notif);

      // 1. Chèn vào đầu list
      setNotifications(prev => [notif, ...prev]);

      // 2. Tăng badge
      setUnreadCount(prev => prev + 1);

      // 3. Báo cho component khác (hiện toast)
      setLatestNotification(notif);

      // 4. Browser notification (nếu đã cấp quyền)
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(notif.title, {
            body: notif.content || '',
            icon: '/icons/192.png',
            badge: '/icons/192.png',
            tag: notif.id,
          });
        } catch (err) {
          // Bỏ qua lỗi
        }
      }

      // 5. Rung (mobile)
      if ('vibrate' in navigator) {
        try { navigator.vibrate?.([200, 100, 200]); } catch {}
      }
    },
  });

  const markAsRead = useCallback(async (id: string) => {
    await apiClient.markNotificationRead?.(id);
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    await apiClient.markAllNotificationsRead?.();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    latestNotification,
    isLoading,
    isConnected,
    markAsRead,
    markAllAsRead,
    reload: loadInitial,
  };
}