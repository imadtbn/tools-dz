const VERSION = 'v4';
const STATIC_CACHE = `tools-dz-static-${VERSION}`;
const RUNTIME_CACHE = `tools-dz-runtime-${VERSION}`;
const OFFLINE_URL = './offline.html';

const PRECACHE = [
    './', './index.html', OFFLINE_URL, './404.html', './manifest.webmanifest',
    './assets/css/main.css', './assets/css/responsive.css', './assets/css/tools.css',
    './assets/css/currency-converter.css', './assets/js/currency-converter.js',
    './assets/js/app.js', './assets/js/theme.js', './assets/js/search.js',
    './assets/js/tools.js', './assets/js/favorites.js', './assets/js/procedures.js',
    './data/tools.json', './data/categories.json', './data/procedures/procedures.json',
    './tools/currency-converter.html', './pages/tools.html', './pages/categories.html', './pages/favorites.html',
    './pages/procedures.html'
];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(STATIC_CACHE).then(cache => cache.addAll(PRECACHE)));
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(key => key.startsWith('tools-dz-') && ![STATIC_CACHE, RUNTIME_CACHE].includes(key))
                .map(key => caches.delete(key))
        )).then(() => self.clients.claim())
    );
});

async function networkFirst(request) {
    const cache = await caches.open(RUNTIME_CACHE);
    try {
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
    } catch (error) {
        return (await cache.match(request)) || (request.mode === 'navigate' ? caches.match(OFFLINE_URL) : Response.error());
    }
}

async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) {
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(request, response.clone());
    }
    return response;
}

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;
    const url = new URL(event.request.url);
    const sameOrigin = url.origin === self.location.origin;

    if (event.request.mode === 'navigate' || (sameOrigin && url.pathname.includes('/data/'))) {
        event.respondWith(networkFirst(event.request));
        return;
    }

    if (sameOrigin || ['cdnjs.cloudflare.com', 'unpkg.com', 'cdn.jsdelivr.net'].includes(url.hostname)) {
        event.respondWith(cacheFirst(event.request));
    }
});

self.addEventListener('message', event => {
    if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
