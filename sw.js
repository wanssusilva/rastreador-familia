self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));

self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : { title: 'Aviso', body: 'Mudança de posição detectada' };
    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: 'https://cdn-icons-png.flaticon.com/512/854/854878.png',
            vibrate: [200, 100, 200]
        })
    );
});
