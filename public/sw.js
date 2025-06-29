// Simple service worker for push notifications
self.addEventListener('install', function (event) {
    self.skipWaiting();
});

self.addEventListener('activate', function (event) {
    self.clients.claim();
});

self.addEventListener('push', function (event) {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Dog Bath Reminder';
    const options = {
        body: data.body || 'It\'s time to give your dog a bath! Check the weather forecast.',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
    };
    event.waitUntil(self.registration.showNotification(title, options));
});
