/**
 * 🎓 STUDYFLOW - Service Worker for Background Notifications & Web Push
 */

const CACHE_NAME = 'studyflow-cache-v1';

// Install event
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Push notification event (triggered from Web Push server / Supabase Edge Function)
self.addEventListener('push', (event) => {
  let data = {
    title: '📚 Task Reminder',
    message: 'You have an upcoming coursework deadline.',
    url: '/',
    taskId: null,
    urgency: 'high'
  };

  if (event.data) {
    try {
      data = Object.assign(data, event.data.json());
    } catch (e) {
      data.message = event.data.text();
    }
  }

  const options = {
    body: data.message,
    icon: '/icon-192.png', // Fallback or app icon
    badge: '/badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      taskId: data.taskId
    },
    actions: [
      { action: 'open', title: 'View Task' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/#tasks';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing window if open
      for (let client of windowClients) {
        if (client.url.includes('localhost') || client.url.includes('studyflow') || client.url.includes(self.location.origin)) {
          if ('focus' in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
