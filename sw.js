const VERSION = 'v40';
const STATIC_CACHE = `tools-dz-static-${VERSION}`;
const RUNTIME_CACHE = `tools-dz-runtime-${VERSION}`;
const OFFLINE_URL = './offline.html';

const PRECACHE = [
    './', './index.html', OFFLINE_URL, './404.html', './manifest.webmanifest',
    './assets/css/main.css', './assets/css/responsive.css', './assets/css/tools.css', './assets/css/tool-hero.css',
    './assets/css/calorie-calculator.css', './assets/js/calorie-calculator.js',
    './assets/css/currency-converter.css', './assets/js/currency-converter.js',
    './assets/css/unit-converter.css', './assets/js/unit-converter.js',
    './assets/css/farm-planner.css', './assets/js/farm-planner.js', './assets/css/budget-manager.css', './assets/js/budget-manager.js',
    './assets/css/vaccine-tracker.css', './assets/js/vaccine-tracker.js',
    './assets/css/number-to-words.css', './assets/js/number-to-words.js',
    './assets/css/inventory-manager.css', './assets/js/inventory-manager.js',
    './assets/css/meal-planner.css', './assets/js/meal-planner.js', './tools/meal-planner.html', './assets/css/exam-study-planner.css', './assets/js/exam-study-planner.js', './tools/exam-study-planner.html', './assets/css/admin-procedures-assistant.css', './assets/js/admin-procedures-assistant.js', './assets/css/hijri-calendar.css', './assets/js/hijri-calendar.js', './data/procedures/admin-procedures.json', './data/medical/vaccines/algeria.json',
    './assets/js/app.js', './assets/js/theme.js', './assets/js/search.js',
    './assets/js/tools.js', './assets/js/favorites.js', './assets/js/procedures.js',
    './data/tools.json', './data/categories.json', './data/procedures/procedures.json',
    './tools/hijri-calendar.html', './tools/number-to-words.html', './tools/inventory-manager.html', './tools/admin-procedures-assistant.html', './tools/budget-manager.html', './tools/vaccine-tracker.html', './tools/currency-converter.html', './tools/unit-converter.html', './tools/farm-planner.html', './tools/calorie-calculator.html', './pages/tools.html', './pages/categories.html', './pages/favorites.html',
    './pages/procedures.html',
    './assets/css/health-tools.css', './assets/css/health-directory.css',
    './assets/js/health-runtime.js',
    './assets/js/health-calculators.js',
    './data/cdc-bmi-for-age.json',
    './data/who-infant-growth.json',
    './tools/health-tools.html',
    './tools/child-bmi-calculator.html',
    './tools/ideal-weight-calculator.html',
    './tools/fertile-window.html',
    './tools/infant-growth-calculator.html',
    './tools/pregnancy-calorie-calculator.html',
    './tools/pregnancy-due-date.html',
    './tools/water-calculator.html',
    './tools/anxiety-screening.html',
    './tools/asthma-control.html',
    './tools/depression-screening.html',
    './tools/diabetes-awareness.html',
    './tools/eating-awareness.html',
    './tools/sleep-assessment.html',
    './tools/visual-acuity-screening.html',
    './tools/pilgrim-health-checklist.html',
    './tools/prediabetes-risk.html'
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
