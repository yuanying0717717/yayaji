/* 芽芽记 Service Worker：离线优先缓存，数据始终保存在本地，本文件不做任何网络上传 */
const C = 'yayaji-v1';
const ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './css/style.css',
  './js/util.js', './js/store.js', './js/charts.js', './js/export.js',
  './js/forms.js', './js/views.js', './js/app.js',
  './icons/icon-192.png', './icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      const cp = res.clone();
      caches.open(C).then(c => c.put(e.request, cp));
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
