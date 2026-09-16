const BASE_PATH = (() => {
    if (!window.location.hostname.endsWith('github.io')) return '';
    const repository = window.location.pathname.split('/').filter(Boolean)[0];
    return repository ? `/${repository}` : '';
})();

function resolveUrl(url) {
    if (!url.startsWith('/')) return url;
    return `${BASE_PATH}${url}`;
}

function showUpdateNotice(registration) {
    if (document.getElementById('pwa-update-notice')) return;
    const notice = document.createElement('div');
    notice.id = 'pwa-update-notice';
    notice.className = 'pwa-update-notice';
    notice.innerHTML = '<span>يتوفر تحديث جديد للموقع.</span><button type="button">تحديث الآن</button>';
    notice.querySelector('button').addEventListener('click', () => {
        registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
    });
    document.body.appendChild(notice);
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register(resolveUrl('/sw.js'));
            if (registration.waiting) showUpdateNotice(registration);
            registration.addEventListener('updatefound', () => {
                const worker = registration.installing;
                worker?.addEventListener('statechange', () => {
                    if (worker.state === 'installed' && navigator.serviceWorker.controller) showUpdateNotice(registration);
                });
            });
            let refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (refreshing) return;
                refreshing = true;
                window.location.reload();
            });
        } catch (error) {
            console.error('Service worker registration failed', error);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const year = document.getElementById('current-year');
    if (year) year.textContent = new Date().getFullYear();

    let nav = document.getElementById('main-nav');
    const headerContainer = document.querySelector('#main-header .container');
    if (!nav && headerContainer) {
        nav = document.createElement('nav');
        nav.id = 'main-nav';
        nav.innerHTML = `<ul>
            <li><a href="${resolveUrl('/index.html')}">الرئيسية</a></li>
            <li><a href="${resolveUrl('/pages/tools.html')}">الأدوات</a></li>
            <li><a href="${resolveUrl('/pages/categories.html')}">التصنيفات</a></li>
            <li><a href="${resolveUrl('/pages/procedures.html')}">مساعد المواطن</a></li>
            <li><a href="${resolveUrl('/pages/favorites.html')}">المفضلة</a></li>
        </ul>`;
        headerContainer.appendChild(nav);
    }
    if (!nav) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mobile-menu-toggle';
    button.setAttribute('aria-label', 'فتح القائمة');
    button.setAttribute('aria-controls', nav.id);
    button.setAttribute('aria-expanded', 'false');
    button.textContent = '☰';
    nav.parentNode.insertBefore(button, nav);

    button.addEventListener('click', () => {
        const open = nav.classList.toggle('active');
        button.setAttribute('aria-expanded', String(open));
        button.setAttribute('aria-label', open ? 'إغلاق القائمة' : 'فتح القائمة');
    });
});
