// src/hooks/useAutoPush.ts
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { pushService } from '../services/pushService';

export function useAutoPush() {
  const { currentUser } = useAuth();

  useEffect(() => {
    // ⭐ Cho phép cả KHÁCH (không cần login) subscribe push
    // Chỉ cần browser hỗ trợ
    if (!pushService.isSupported()) {
      console.log('[AUTO-PUSH] Trình duyệt không hỗ trợ push');
      return;
    }

    const init = async () => {
      try {
        const perm = pushService.getPermission();

        // Nếu chưa từng xin quyền → xin luôn (kể cả khách)
        if (perm === 'default') {
          console.log('[AUTO-PUSH] Đang xin quyền thông báo...');
          const newPerm = await pushService.askPermission();
          if (newPerm !== 'granted') {
            console.log('[AUTO-PUSH] User từ chối quyền');
            return;
          }
        }

        if (perm === 'denied') {
          console.log('[AUTO-PUSH] Quyền đã bị chặn');
          return;
        }

        // Đã có quyền → subscribe nếu chưa
        if (pushService.getPermission() === 'granted') {
          const already = await pushService.isSubscribed();
          if (already) {
            console.log('[AUTO-PUSH] Đã subscribe rồi');
            return;
          }

          console.log('[AUTO-PUSH] Đang subscribe...');
          const ok = await pushService.subscribe();
          console.log('[AUTO-PUSH] Subscribe result:', ok);
        }
      } catch (err) {
        console.error('[AUTO-PUSH] Lỗi:', err);
      }
    };

    // Đợi 3s cho trang ổn định
    const timer = setTimeout(init, 3000);
    return () => clearTimeout(timer);
  }, [currentUser?.id]);   // ⭐ Vẫn trigger khi user thay đổi

  // ⭐ THÊM: Lắng nghe sự kiện cài PWA
  useEffect(() => {
    const handleAppInstalled = () => {
      console.log('[AUTO-PUSH] PWA vừa được cài, đang subscribe push...');
      // Đợi 1s cho SW active rồi subscribe
      setTimeout(async () => {
        try {
          await pushService.subscribe();
        } catch (err) {
          console.error('[AUTO-PUSH] Lỗi subscribe sau cài PWA:', err);
        }
      }, 1000);
    };

    window.addEventListener('appinstalled', handleAppInstalled);
    return () => window.removeEventListener('appinstalled', handleAppInstalled);
  }, []);
}