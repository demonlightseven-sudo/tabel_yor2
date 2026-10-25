/* Служебный файл: хранит копию приложения на телефоне, чтобы оно открывалось без интернета.
   Когда интернет есть, приложение подтягивает обновления само. */
const CACHE = 'tabel-app-v179';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png',
                './icon-maskable-512.png', './apple-touch-icon.png', './memo-template.json', './memo-rvd.json', './nd-hz.json', './nd-fire.json', './nd-lift.json', './tbt.json', './akt-abs.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req,{cache:'no-cache'})
      .then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
  );
});

/* push-уведомление: бригадира зовут забрать наряд-допуск с инструктажом (TBT) */
self.addEventListener('push', e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (er) { d = {}; }
  e.waitUntil(self.registration.showNotification(d.title || '🔔 Вас зовут за нарядом', {
    body: d.body || 'Заберите наряд-допуск с инструктажом (TBT)',
    tag: 'tabel-call', renotify: true, requireInteraction: true,
    vibrate: [400, 150, 400, 150, 700], icon: 'icon-192.png', badge: 'icon-192.png', data: { url: './' }
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if ('focus' in c) return c.focus(); }
    return self.clients.openWindow('./');
  }));
});
