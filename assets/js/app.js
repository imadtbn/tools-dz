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
    // Shared share/help controls: placed directly after the page Hero on all pages using app.js.
    (() => {
        if (document.getElementById('share-help-tools')) return;

        const style = document.createElement('style');
        style.id = 'share-help-tools-styles';
        style.textContent = `
            .share-help-tools {
                position: relative;
                z-index: 2;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: .65rem;
                width: min(100% - 2rem, 1200px);
                margin: .8rem auto 1.15rem;
                padding: 0 .5rem;
                direction: rtl;
                box-sizing: border-box;
            }
            .share-help-tools *, .share-help-tools *::before, .share-help-tools *::after { box-sizing: border-box; }
            .share-help-tools__share {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: .55rem;
                min-height: 44px;
                padding: .65rem 1.15rem;
                border: 1px solid #c62838;
                border-radius: 999px;
                background: linear-gradient(135deg, #e54655, #c62838);
                color: #fff !important;
                font: inherit;
                font-weight: 700;
                line-height: 1.2;
                text-decoration: none;
                white-space: nowrap;
                box-shadow: 0 4px 12px rgba(198,40,56,.18);
                cursor: pointer;
                transition: transform .2s ease, box-shadow .2s ease, background .2s ease;
                animation: share-help-gentle-pulse 22s ease-in-out infinite;
            }
            .share-help-tools__share:hover, .share-help-tools__share:focus-visible {
                transform: translateY(-1px);
                box-shadow: 0 6px 18px rgba(198,40,56,.28);
                background: linear-gradient(135deg, #d93645, #b71c2c);
            }
            .share-help-tools__share svg { width: 18px; height: 18px; flex: 0 0 18px; }
            .share-help-tools__help-wrap { position: relative; display: inline-flex; align-items: center; }
            .share-help-tools__help {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 38px;
                height: 38px;
                flex: 0 0 38px;
                padding: 0;
                border: 1px solid #d93645;
                border-radius: 50%;
                color: #c62838;
                background: var(--surface-color, #fff);
                font: inherit;
                font-size: 1.15rem;
                font-weight: 800;
                cursor: pointer;
                box-shadow: 0 2px 8px rgba(198,40,56,.10);
                transition: transform .2s ease, box-shadow .2s ease, background .2s ease;
                animation: share-help-gentle-pulse 22s ease-in-out infinite;
                animation-delay: .12s;
            }
            .share-help-tools__help:hover, .share-help-tools__help:focus-visible,
            .share-help-tools__help[aria-expanded="true"] {
                transform: translateY(-1px);
                box-shadow: 0 4px 13px rgba(198,40,56,.22);
                background: rgba(217,54,69,.07);
                outline-offset: 3px;
            }
            .share-help-tools__tooltip {
                position: absolute;
                top: calc(100% + 10px);
                inset-inline-end: 0;
                z-index: 50;
                width: min(280px, calc(100vw - 2rem));
                padding: .8rem .95rem;
                border: 1px solid var(--border-color, #e0e0e0);
                border-radius: 12px;
                background: var(--surface-color, #fff);
                color: var(--text-color, #263238);
                box-shadow: 0 8px 24px rgba(0,0,0,.13);
                font-size: .9rem;
                line-height: 1.65;
                text-align: start;
                opacity: 0;
                visibility: hidden;
                transform: translateY(-4px);
                transition: opacity .16s ease, transform .16s ease, visibility .16s ease;
                pointer-events: none;
            }
            .share-help-tools__tooltip::before {
                content: "";
                position: absolute;
                bottom: 100%;
                inset-inline-end: 12px;
                border: 7px solid transparent;
                border-bottom-color: var(--border-color, #e0e0e0);
            }
            .share-help-tools__help-wrap:hover .share-help-tools__tooltip,
            .share-help-tools__help-wrap:focus-within .share-help-tools__tooltip,
            .share-help-tools__help-wrap.is-open .share-help-tools__tooltip {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }
            .share-help-tools__status {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0,0,0,0);
                white-space: nowrap;
                border: 0;
            }
            @keyframes share-help-gentle-pulse {
                0%, 89%, 100% { box-shadow: 0 3px 10px rgba(198,40,56,.12); }
                91% { box-shadow: 0 0 0 4px rgba(217,54,69,.10), 0 4px 14px rgba(198,40,56,.22); }
                93% { box-shadow: 0 3px 10px rgba(198,40,56,.12); }
                95% { box-shadow: 0 0 0 4px rgba(217,54,69,.08), 0 4px 14px rgba(198,40,56,.20); }
                97% { box-shadow: 0 3px 10px rgba(198,40,56,.12); }
            }
            @media (max-width: 600px) {
                .share-help-tools { width: calc(100% - 1.25rem); gap: .55rem; margin: .65rem auto .95rem; }
                .share-help-tools__share { min-height: 42px; padding: .6rem 1rem; font-size: .94rem; }
                .share-help-tools__help { width: 36px; height: 36px; flex-basis: 36px; }
                .share-help-tools__tooltip { inset-inline-end: -2px; width: min(260px, calc(100vw - 2rem)); }
            }
            @media (prefers-reduced-motion: reduce) {
                .share-help-tools__share, .share-help-tools__help { animation: none !important; transition: none !important; }
                .share-help-tools__share:hover, .share-help-tools__help:hover { transform: none; }
            }
        `;
        document.head.appendChild(style);

        const wrapper = document.createElement('section');
        wrapper.id = 'share-help-tools';
        wrapper.className = 'share-help-tools';
        wrapper.setAttribute('aria-label', 'مشاركة الصفحة وطلب المساعدة');
        wrapper.innerHTML = `
            <button class="share-help-tools__share" type="button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle>
                    <path d="m8.6 10.6 6.8-4.2M8.6 13.4l6.8 4.2"></path>
                </svg>
                <span>مشاركة</span>
            </button>
            <span class="share-help-tools__help-wrap">
                <button class="share-help-tools__help" type="button" aria-label="لماذا أشارك هذه الصفحة؟" aria-expanded="false" aria-controls="share-help-tooltip">؟</button>
                <span class="share-help-tools__tooltip" id="share-help-tooltip" role="tooltip">هل أفادتك هذه الصفحة؟ شاركها مع أصدقائك ليستفيدوا من الأدوات والخدمات أيضًا.</span>
            </span>
            <span class="share-help-tools__status" role="status" aria-live="polite"></span>
        `;

        const hero = document.querySelector('main .tool-hero, main .hero-section, main .home-hero, main .page-hero, main .farm-hero, main .catalog-hero, main .hero');
        if (hero) {
            const topAd = hero.nextElementSibling?.classList.contains('health-top-ad')
                ? hero.nextElementSibling
                : null;
            (topAd || hero).insertAdjacentElement('afterend', wrapper);
        } else {
            const main = document.querySelector('main');
            const header = document.getElementById('main-header');
            if (main?.firstElementChild) main.insertBefore(wrapper, main.firstElementChild);
            else if (main) main.prepend(wrapper);
            else if (header) header.insertAdjacentElement('afterend', wrapper);
            else document.body.prepend(wrapper);
        }

        const shareButton = wrapper.querySelector('.share-help-tools__share');
        const helpButton = wrapper.querySelector('.share-help-tools__help');
        const helpWrap = wrapper.querySelector('.share-help-tools__help-wrap');
        const status = wrapper.querySelector('.share-help-tools__status');
        const tooltip = wrapper.querySelector('.share-help-tools__tooltip');
        const isTouchLike = window.matchMedia('(hover: none), (pointer: coarse)').matches;
        const pageTitle = () => document.querySelector('main h1')?.textContent?.trim() || document.title || 'Tools DZ';

        const announce = (message) => {
            status.textContent = '';
            window.setTimeout(() => { status.textContent = message; }, 20);
        };
        const copyPageLink = async () => {
            const url = window.location.href;
            try {
                if (navigator.clipboard?.writeText && window.isSecureContext) {
                    await navigator.clipboard.writeText(url);
                } else {
                    const input = document.createElement('textarea');
                    input.value = url;
                    input.setAttribute('readonly', '');
                    input.style.position = 'fixed';
                    input.style.opacity = '0';
                    input.style.insetInlineStart = '-9999px';
                    document.body.appendChild(input);
                    input.select();
                    const copied = document.execCommand('copy');
                    input.remove();
                    if (!copied) throw new Error('Copy unavailable');
                }
                announce('تم نسخ رابط الصفحة بنجاح.');
            } catch (error) {
                announce('تعذّر نسخ الرابط تلقائيًا. يمكنك نسخ الرابط من شريط العنوان.');
            }
        };

        shareButton.addEventListener('click', async () => {
            const shareData = { title: pageTitle(), text: 'اكتشف هذه الصفحة من Tools DZ', url: window.location.href };
            if (navigator.share) {
                try {
                    await navigator.share(shareData);
                    announce('تم فتح خيارات المشاركة.');
                    return;
                } catch (error) {
                    if (error?.name === 'AbortError') return;
                }
            }
            await copyPageLink();
        });

        const closeHelp = () => {
            helpWrap.classList.remove('is-open');
            helpButton.setAttribute('aria-expanded', 'false');
        };
        helpButton.addEventListener('click', (event) => {
            event.stopPropagation();
            if (isTouchLike) {
                const open = !helpWrap.classList.contains('is-open');
                helpWrap.classList.toggle('is-open', open);
                helpButton.setAttribute('aria-expanded', String(open));
            } else {
                // Click also works for keyboard users on desktop.
                const open = !helpWrap.classList.contains('is-open');
                helpWrap.classList.toggle('is-open', open);
                helpButton.setAttribute('aria-expanded', String(open));
            }
        });
        document.addEventListener('click', (event) => {
            if (!helpWrap.contains(event.target)) closeHelp();
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') closeHelp();
        });
        tooltip.addEventListener('click', (event) => event.stopPropagation());
    })();
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
