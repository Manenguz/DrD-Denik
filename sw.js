const CACHE_NAME = 'drd2-cache-v1';
const FILES_TO_CACHE = [
    './index.html',
    './app.js',
    './base.css',
    './theme-blue.css',
    './theme-dark.css',
    './theme-green.css',
    './theme-parchment.css',
    './theme-red.css',
    './classes.json',
    './favicon.png'
];

self.addEventListener('install', evt => {
    evt.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
    );
});

self.addEventListener('fetch', evt => {
    evt.respondWith(
        caches.match(evt.request).then(resp => resp || fetch(evt.request))
    );
});
