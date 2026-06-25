// ResQ Push Notification Service Worker
// This runs in the background even when the browser is closed

self.addEventListener('install', (event) => {
  console.log('[SW] ResQ Service Worker installed.');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] ResQ Service Worker activated.');
  event.waitUntil(self.clients.claim());
});

// Handle incoming push notifications from the backend
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: 'ResQ', body: event.data.text() };
  }

  const { title, body, icon, badge, url, tag, renotify } = data;

  const notificationOptions = {
    body: body || 'You have a new notification from ResQ.',
    icon: icon || '/favicon.svg',
    badge: badge || '/favicon.svg',
    tag: tag || 'resq-notification',
    renotify: renotify !== undefined ? renotify : true,
    requireInteraction: false,
    vibrate: [200, 100, 200],
    data: { url: url || '/dashboard' }
  };

  event.waitUntil(
    self.registration.showNotification(title || 'ResQ AI', notificationOptions)
  );
});

// Handle notification click — open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // If the app is already open, focus it
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open a new tab
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
