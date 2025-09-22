self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'ADHD Cleaning App';
  const body  = data.body  || 'You have a task!';
  const url   = data.url   || '/';
  event.waitUntil(self.registration.showNotification(title, { body, data: { url } }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification?.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});
