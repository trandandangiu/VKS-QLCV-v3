// frontend/src/components/header/NotificationBell.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, CheckCheck, ArrowRight } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { formatRelativeTime } from '../../utils/format';

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const {
    notifications,
    unreadCount,
    latestNotification,
    markAsRead,
    markAllAsRead,
    isConnected,
  } = useNotifications();

  // ⭐ Toast to hơn, có nút "Xem ngay"
  const [toast, setToast] = useState<{
    id: string;
    title: string;
    content?: string;
    dispatchId?: string;
  } | null>(null);

  useEffect(() => {
    if (latestNotification && !latestNotification.isRead) {
      setToast({
        id: latestNotification.id,
        title: latestNotification.title,
        content: latestNotification.content,
        dispatchId: latestNotification.dispatchId,
      });

      // Tự đóng sau 8 giây
      const t = setTimeout(() => setToast(null), 8000);
      return () => clearTimeout(t);
    }
  }, [latestNotification]);

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ⭐ Xử lý click notification — điều hướng rõ ràng
  const handleClickNotification = async (n: any) => {
    // 1. Đánh dấu đã đọc
    if (!n.isRead) {
      await markAsRead(n.id);
    }

    // 2. Đóng dropdown + toast
    setIsOpen(false);
    setToast(null);

    // 3. Điều hướng
    if (n.dispatchId) {
      // ⭐ Điều hướng đến trang chi tiết công văn
      navigate(`/dispatches/${n.dispatchId}`);
    } else if (n.referenceType === 'dispatch' && n.referenceId) {
      navigate(`/dispatches/${n.referenceId}`);
    } else {
      // Không có dispatch → điều hướng theo type
      switch (n.type) {
        case 'TASK_ASSIGNED':
          navigate('/');
          break;
        default:
          navigate('/');
      }
    }
  };

  // ⭐ Xử lý click toast "Xem ngay"
  const handleToastView = async () => {
    if (!toast) return;

    // Đánh dấu đã đọc
    try {
      await markAsRead(toast.id);
    } catch {
      /* ignore */
    }

    const dispatchId = toast.dispatchId;
    setToast(null);

    if (dispatchId) {
      navigate(`/dispatches/${dispatchId}`);
    } else {
      navigate('/');
    }
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 rounded-xl hover:bg-white/10 transition cursor-pointer"
          title="Thông báo"
        >
          <Bell className="w-5 h-5 text-white" />

          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white/90 animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}


        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-slate-700" />
                <span className="font-bold text-slate-900 text-sm">Thông báo</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                    {unreadCount} mới
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="p-1.5 rounded-lg hover:bg-slate-200 transition cursor-pointer"
                    title="Đánh dấu tất cả đã đọc"
                  >
                    <CheckCheck className="w-4 h-4 text-slate-600" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 transition cursor-pointer"
                >
                  <X className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Chưa có thông báo nào
                </div>
              ) : (
                notifications.slice(0, 20).map(n => (
                  <button
                    key={n.id}
                    onClick={() => handleClickNotification(n)}
                    className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 active:bg-slate-100 transition cursor-pointer ${!n.isRead ? 'bg-blue-50/40' : ''
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.isRead ? 'bg-blue-600' : 'bg-slate-300'
                          }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-sm ${!n.isRead
                              ? 'font-bold text-slate-900'
                              : 'font-medium text-slate-700'
                            }`}
                        >
                          {n.title}
                        </div>
                        {n.content && (
                          <div className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {n.content}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 mt-1.5 font-medium flex items-center justify-between">
                          <span>{formatRelativeTime(n.createdAt)}</span>
                          {n.dispatchId && (
                            <span className="text-blue-600 font-bold flex items-center gap-0.5">
                              Xem
                              <ArrowRight className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ⭐ TOAST NỔI BẬT — góc trên bên phải */}
      {toast && (
        <div className="fixed top-20 right-4 z-[60] max-w-sm animate-slideInRight">
          <div className="bg-white rounded-2xl shadow-2xl border-l-4 border-red-600 border border-slate-200 overflow-hidden">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-wider text-red-600 mb-0.5">
                    Thông báo mới
                  </div>
                  <div className="font-bold text-slate-900 text-sm leading-tight">
                    {toast.title}
                  </div>
                  {toast.content && (
                    <div className="text-xs text-slate-600 mt-1 line-clamp-2">
                      {toast.content}
                    </div>
                  )}

                  {/* Nút hành động */}
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={handleToastView}
                      className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      Xem ngay
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setToast(null)}
                      className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-lg transition cursor-pointer"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setToast(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};