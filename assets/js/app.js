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
    // Apply the official circular Tools DZ icon consistently to every shared header/footer.
    const siteIconUrl = resolveUrl('/icon-512.png');
    const headerLogo = document.querySelector('#main-header .logo a');
    if (headerLogo && !headerLogo.querySelector('.site-brand-icon')) {
        const icon = document.createElement('img');
        icon.className = 'site-brand-icon site-brand-icon-header';
        icon.src = siteIconUrl;
        icon.alt = '';
        icon.width = 48;
        icon.height = 48;
        icon.decoding = 'async';
        icon.setAttribute('aria-hidden', 'true');
        headerLogo.prepend(icon);
        headerLogo.classList.add('site-brand-link');
    }

    const footerInfo = document.querySelector('#main-footer .footer-info');
    if (footerInfo && !footerInfo.querySelector('.site-footer-brand')) {
        const brand = document.createElement('a');
        brand.className = 'site-footer-brand';
        brand.href = resolveUrl('/index.html');
        brand.setAttribute('aria-label', 'Tools DZ - الصفحة الرئيسية');

        const icon = document.createElement('img');
        icon.className = 'site-brand-icon site-brand-icon-footer';
        icon.src = siteIconUrl;
        icon.alt = '';
        icon.width = 56;
        icon.height = 56;
        icon.decoding = 'async';
        icon.setAttribute('aria-hidden', 'true');

        const name = document.createElement('span');
        name.className = 'site-footer-brand-name';
        name.textContent = 'Tools DZ';

        brand.append(icon, name);
        footerInfo.prepend(brand);
    }

    const year = document.getElementById('current-year');
    if (year) year.textContent = new Date().getFullYear();

    // Footer enhancements are shared by home, content pages and individual tools.
    const footer = document.getElementById('main-footer');
    if (footer) {
        const footerIcons = {
            'about.html': 'fa-circle-info',
            'contact.html': 'fa-envelope',
            'privacy.html': 'fa-shield-halved',
            'terms.html': 'fa-file-contract',
            'disclaimer.html': 'fa-triangle-exclamation',
            'index.html': 'fa-house',
            'tools.html': 'fa-screwdriver-wrench',
            'categories.html': 'fa-layer-group',
            'procedures.html': 'fa-landmark',
            'favorites.html': 'fa-heart'
        };

        footer.querySelectorAll('.footer-links a[href]').forEach(link => {
            const url = new URL(link.getAttribute('href'), document.baseURI);
            const page = url.pathname.split('/').pop();
            link.classList.add('footer-link');

            if (!link.querySelector('.footer-link-icon')) {
                const icon = document.createElement('i');
                icon.className = `footer-link-icon fa-solid ${footerIcons[page] || 'fa-link'}`;
                icon.setAttribute('aria-hidden', 'true');
                link.prepend(icon);
            }

            if (url.pathname === window.location.pathname) {
                link.setAttribute('aria-current', 'page');
            }
        });

        // The old Facebook/Twitter/Instagram entries all point to "#".
        // Replace those dead links with real, relevant destinations.
        const socialArea = footer.querySelector('.footer-info > div');
        const socialLinks = socialArea?.querySelectorAll('a[href]');
        if (socialLinks?.length && Array.from(socialLinks).every(link => link.getAttribute('href') === '#')) {
            socialArea.classList.add('footer-social');
            socialArea.replaceChildren();
            [
                { href: 'https://github.com/imadtbn/tools-dz', label: 'مستودع المنصة على GitHub', icon: 'fa-brands fa-github' },
                { href: resolveUrl('/pages/contact.html'), label: 'تواصل معنا', icon: 'fa-solid fa-envelope' }
            ].forEach(item => {
                const link = document.createElement('a');
                link.href = item.href;
                link.setAttribute('aria-label', item.label);
                link.title = item.label;
                const icon = document.createElement('i');
                icon.className = item.icon;
                icon.setAttribute('aria-hidden', 'true');
                link.appendChild(icon);
                socialArea.appendChild(link);
            });
        }
    }

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
