// sw.js — Service Worker
const CACHE_NAME = 'pwa-demo-v1';

// ─── 安裝：快取靜態資源 ──────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(['/', '/index.html'])
    )
  );
  self.skipWaiting();
});

// ─── 啟動 ────────────────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

// ─── Fetch：離線快取策略（Cache First）───────────────────────────────────
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached =>
      cached || fetch(event.request)
    )
  );
});

// ─── 收到推播（來自後端）────────────────────────────────────────────────
self.addEventListener('push', event => {
  // 從後端傳來的資料（JSON 格式）
  let data = { title: '新通知', body: '你有一則新訊息', url: '/' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: '/badge-72.png',
    tag: data.tag || 'default',
    requireInteraction: false,
    data: { url: data.url || '/' },
    actions: [
      { action: 'open',    title: '查看' },
      { action: 'dismiss', title: '關閉' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ─── 使用者點擊通知 ──────────────────────────────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // 如果 App 已開啟，直接 focus
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // 否則開新視窗
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
