// frontend/src/sw.ts
/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare const self: ServiceWorkerGlobalScope;

// ═══════════════════════════════════════════
// 1. PRECACHE
// ═══════════════════════════════════════════
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// ═══════════════════════════════════════════
// 2. RUNTIME CACHE
// ═══════════════════════════════════════════
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/dispatches'),
  new NetworkFirst({
    cacheName: 'api-dispatches-cache',
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 30 }),
    ],
  })
);

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-general-cache',
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 }),
    ],
  })
);

// ═══════════════════════════════════════════
// 3. ⭐ PUSH NOTIFICATION
// ═══════════════════════════════════════════
self.addEventListener('push', (event: PushEvent) => {
  console.log('🔔 [SW] Nhận push event');

  let data: any = {
    title: 'VKS-QLCV',
    body: 'Bạn có thông báo mới',
    icon: '/icons/192.png',
    badge: '/icons/192.png',
    data: { url: '/' },
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch {
      data.body = event.data.text();
    }
  }

  const options: NotificationOptions = {
    body: data.body,
    icon: data.icon || '/icons/192.png',
    badge: data.badge || '/icons/192.png',
    tag: data.tag || 'vks-notification',
    data: data.data || { url: '/' },
  } as any;

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ═══════════════════════════════════════════
// 4. ⭐ NOTIFICATION CLICK
// ═══════════════════════════════════════════
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';
  const fullUrl = new URL(urlToOpen, self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus();
            if ('navigate' in client) {
              return (client as WindowClient).navigate(fullUrl);
            }
            return;
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(fullUrl);
        }
      })
  );
});

// ═══════════════════════════════════════════
// 5. ACTIVATE
// ═══════════════════════════════════════════
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(self.clients.claim());
});

// ═══════════════════════════════════════════
// 6. MESSAGE — Nhận lệnh từ main thread
// ═══════════════════════════════════════════
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

export {};