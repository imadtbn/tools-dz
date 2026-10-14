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
            <li><a href="${resolveUrl('/pages/tools.html')}">جميع الأدوات</a></li>
            <li><a href="${resolveUrl('/pages/categories.html')}">التصنيفات</a></li>
            <li><a href="${resolveUrl('/pages/procedures.html')}">منصات وخدمات رقمية</a></li>
            <li><a href="${resolveUrl('/pages/favorites.html')}">المفضلة</a></li>
        </ul>`;
        headerContainer.appendChild(nav);
    }
    if (!nav || !headerContainer) return;

    nav.setAttribute('aria-label', 'التنقل الرئيسي');

    // Enhance both static navigation markup and menus generated on tool pages.
    const navIcons = {
        'index.html': 'fa-house',
        'tools.html': 'fa-screwdriver-wrench',
        'categories.html': 'fa-layer-group',
        'procedures.html': 'fa-landmark',
        'favorites.html': 'fa-heart'
    };
    const currentPath = window.location.pathname;
    const seen = new Set();

    nav.querySelectorAll('a[href]').forEach(link => {
        const target = new URL(link.getAttribute('href'), document.baseURI);
        const targetPath = target.pathname;
        if (seen.has(targetPath)) {
            // Some existing pages contain the same navigation item twice.
            link.closest('li')?.remove();
            return;
        }
        seen.add(targetPath);

        const page = targetPath.split('/').pop();
        const icon = navIcons[page];
        if (icon && !link.querySelector('.nav-icon')) {
            const element = document.createElement('i');
            element.className = `nav-icon fa-solid ${icon}`;
            element.setAttribute('aria-hidden', 'true');
            link.prepend(element);
        }
        const exactMatch = currentPath === targetPath
            || (page === 'index.html' && currentPath === targetPath.replace(/index\.html$/, ''));
        if (exactMatch) {
            link.setAttribute('aria-current', 'page');
        } else if (page === 'tools.html' && currentPath.includes('/tools/')) {
            link.classList.add('nav-parent-active');
        }
    });

    // Keep the menu button next to the theme action when present.
    let button = headerContainer.querySelector('.mobile-menu-toggle');
    if (!button) {
        button = document.createElement('button');
        button.type = 'button';
        button.className = 'mobile-menu-toggle';
        const actions = headerContainer.querySelector('.header-actions');
        if (actions) actions.prepend(button);
        else nav.insertAdjacentElement('afterend', button);
    }
    button.setAttribute('aria-label', 'فتح القائمة');
    button.setAttribute('aria-controls', nav.id);
    button.setAttribute('aria-expanded', 'false');
    button.textContent = '☰';

    const toggleMenu = (open) => {
        nav.classList.toggle('active', open);
        button.setAttribute('aria-expanded', String(open));
        button.setAttribute('aria-label', open ? 'إغلاق القائمة' : 'فتح القائمة');
        button.textContent = open ? '✕' : '☰';
    };

    button.addEventListener('click', () => {
        toggleMenu(!nav.classList.contains('active'));
    });
    nav.addEventListener('click', (event) => {
        if (event.target.closest('a')) toggleMenu(false);
    });
    document.addEventListener('click', (event) => {
        if (nav.classList.contains('active') && !headerContainer.contains(event.target)) {
            toggleMenu(false);
        }
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && nav.classList.contains('active')) {
            toggleMenu(false);
            button.focus();
        }
    });
    window.matchMedia('(min-width: 1101px)').addEventListener('change', (event) => {
        if (event.matches) toggleMenu(false);
    });
});
