// CaribSA push service worker: empty push -> ask Apps Script for the message -> show it
var EXEC = 'https://script.google.com/macros/s/AKfycbyLpOXi5nIZTzGGXE7ZQy14nAot-_JE4xROF3Xq2l_FP6RPRB7RzgvW9OrC1DsSez0l/exec';
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('push', function (e) {
  e.waitUntil(self.registration.pushManager.getSubscription()
    .then(function (sub) { return crypto.subtle.digest('SHA-256', new TextEncoder().encode(sub.endpoint)); })
    .then(function (h) { return Array.prototype.map.call(new Uint8Array(h), function (b) { return b.toString(16).padStart(2, '0'); }).join('').slice(0, 32); })
    .then(function (id) { return (function get(n) { return fetch(EXEC + '?push=' + id + '&_=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.json(); }).catch(function (err) { if (n > 0) return get(n - 1); throw err; }); })(1); })
    .then(function (j) { return j && j.items && j.items[0]; })
    .catch(function () { return null; })
    .then(function (m) {
      // every push MUST show a notification or iOS turns push off
      return self.registration.showNotification(m ? m.title : 'CaribSA', {
        body: m ? m.body : 'Something new is waiting in the portal.',
        icon: 'apple-touch-icon.png', badge: 'icon-192.png', tag: m && m.tag ? m.tag : undefined,
        data: { url: (m && m.url) || './' }
      });
    }));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) { if (list[i].url.indexOf(self.registration.scope) === 0 && 'focus' in list[i]) return list[i].focus(); }
    return self.clients.openWindow(url);
  }));
});
