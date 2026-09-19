(() => {
    'use strict';

    const ARABIC_DIACRITICS = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;

    function normalize(value = '') {
        return String(value)
            .toLocaleLowerCase('ar')
            .normalize('NFKD')
            .replace(ARABIC_DIACRITICS, '')
            .replace(/[إأآٱ]/g, 'ا')
            .replace(/ى/g, 'ي')
            .replace(/ة/g, 'ه')
            .replace(/ؤ/g, 'و')
            .replace(/ئ/g, 'ي')
            .trim();
    }

    function searchableText(item, type) {
        if (type === 'procedure') {
            return [
                item.title,
                item.description,
                item.sourceName,
                item.availabilityStatus,
                ...(item.steps || [])
            ].join(' ');
        }
        return [item.name, item.description, ...(item.keywords || [])].join(' ');
    }

    function escapeHtml(value = '') {
        return String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function renderSearchResults(container, results, query) {
        container.classList.remove('hidden');

        if (!results.length) {
            container.innerHTML = `<div class="search-item search-empty">لا توجد منصات أو أدوات مطابقة لـ «${escapeHtml(query)}»</div>`;
            return;
        }

        const groups = [
            { type: 'procedure', label: 'منصات وخدمات رقمية', items: results.filter(result => result.type === 'procedure') },
            { type: 'tool', label: 'أدوات مساعدة', items: results.filter(result => result.type === 'tool') }
        ].filter(group => group.items.length);

        container.innerHTML = groups.map(group => `
            <div class="search-group" data-result-type="${group.type}">
                <h3 class="search-group-title">${group.label}</h3>
                ${group.items.map(({ item, type }) => {
                    const title = type === 'procedure' ? item.title : item.name;
                    const description = type === 'procedure'
                        ? `${item.sourceName} — ${item.description}`
                        : item.description;
                    const url = type === 'procedure' ? item.sourceUrl : resolveUrl(item.url);
                    return `<a href="${escapeHtml(url)}" class="search-item" target="${type === 'procedure' ? '_blank' : '_self'}" rel="${type === 'procedure' ? 'noopener noreferrer' : ''}">
                        <span class="search-icon" aria-hidden="true">${item.icon || '<i class="fa-solid fa-link"></i>'}</span>
                        <span class="search-item-content">
                            <strong>${escapeHtml(title)}</strong>
                            <span>${escapeHtml(description.substring(0, 120))}${description.length > 120 ? '…' : ''}</span>
                        </span>
                        <span class="search-item-arrow" aria-hidden="true">←</span>
                    </a>`;
                }).join('')}
            </div>
        `).join('');
    }

    window.initSearch = function (toolsData = [], proceduresData = []) {
        const searchInput = document.getElementById('main-search');
        const searchResults = document.getElementById('search-results');
        if (!searchInput || !searchResults || searchInput.dataset.searchInitialized === 'true') return;

        searchInput.dataset.searchInitialized = 'true';
        const tools = Array.isArray(toolsData) ? toolsData : [];
        const procedures = Array.isArray(proceduresData) ? proceduresData : [];
        const index = [
            ...procedures.map(item => ({ item, type: 'procedure', text: normalize(searchableText(item, 'procedure')) })),
            ...tools.map(item => ({ item, type: 'tool', text: normalize(searchableText(item, 'tool')) }))
        ];

        function search(value) {
            const query = normalize(value);
            if (!query) {
                searchResults.classList.add('hidden');
                searchResults.innerHTML = '';
                return;
            }
            const results = index
                .filter(entry => entry.text.includes(query))
                .slice(0, 12);
            renderSearchResults(searchResults, results, value.trim());
        }

        searchInput.addEventListener('input', event => search(event.target.value));
        searchInput.addEventListener('focus', () => {
            if (searchInput.value.trim()) search(searchInput.value);
        });
        searchInput.addEventListener('blur', () => {
            setTimeout(() => searchResults.classList.add('hidden'), 200);
        });
    };

    const searchStyles = document.createElement('style');
    searchStyles.textContent = `
        .search-results-dropdown {
            position: absolute;
            top: calc(100% + 5px);
            left: 0;
            right: 0;
            background: var(--surface-color);
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius);
            box-shadow: 0 8px 24px rgba(0,0,0,0.12);
            max-height: min(70vh, 520px);
            overflow-y: auto;
            z-index: 1000;
        }
        .search-group-title {
            padding: 0.75rem 1rem 0.4rem;
            color: var(--primary-color);
            font-size: 0.9rem;
            border-bottom: 1px solid var(--border-color);
        }
        .search-item {
            display: flex;
            align-items: center;
            gap: 0.8rem;
            padding: 0.85rem 1rem;
            text-decoration: none;
            border-bottom: 1px solid var(--border-color);
            color: var(--text-color);
            transition: background-color 0.2s;
        }
        .search-item:hover { background-color: var(--bg-color); }
        .search-icon { flex: 0 0 2rem; font-size: 1.35rem; text-align: center; color: var(--primary-color); }
        .search-item-content { min-width: 0; flex: 1; }
        .search-item-content strong, .search-item-content span { display: block; }
        .search-item-content strong { color: var(--primary-color); margin-bottom: 0.15rem; }
        .search-item-content span { color: var(--text-muted); font-size: 0.85rem; white-space: normal; }
        .search-item-arrow { color: var(--primary-color); font-size: 1.2rem; }
        .search-empty { display: block; text-align: center; color: var(--text-muted); }
    `;
    document.head.appendChild(searchStyles);
})();
