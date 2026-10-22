(function () {
    'use strict';
    let toolsPromise;
    let categoriesPromise;
    let proceduresPromise;

    async function fetchJson(path) {
        const response = await fetch(resolveUrl(path));
        if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status}`);
        return response.json();
    }

    function getTools() {
        toolsPromise ||= fetchJson('/data/tools.json');
        return toolsPromise;
    }

    function getCategories() {
        categoriesPromise ||= fetchJson('/data/categories.json');
        return categoriesPromise;
    }

    function getProcedures() {
        proceduresPromise ||= fetchJson('/data/procedures/procedures.json');
        return proceduresPromise;
    }

    // Platform IDs in procedures.json are not unique, so use each official URL
    // as a stable, namespaced key in the shared favorites list.
    function getProcedureFavoriteId(procedure) {
        return `platform:${encodeURIComponent(procedure.sourceUrl)}`;
    }

    function createToolCard(tool) {
        const favorite = window.Favorites?.isFavorite(tool.id) || false;
        const badges = [
            tool.new ? '<span class="tool-badge tool-badge-new">جديد</span>' : '',
            tool.offlineReady ? '<span class="tool-badge">دون إنترنت</span>' : ''
        ].filter(Boolean).join('');
        return `<article class="card tool-card" data-tool-id="${tool.id}">
            <div class="card-icon" aria-hidden="true">${tool.icon}</div>
            <div class="tool-card-title"><h4>${tool.name}</h4>${badges ? `<div class="tool-badges">${badges}</div>` : ''}</div>
            <p>${tool.description}</p>
            <div class="tool-card-actions">
                <a href="${resolveUrl(tool.url)}" class="btn">استخدام الأداة</a>
                <button class="fav-btn" type="button" data-id="${tool.id}" aria-label="${favorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}" aria-pressed="${favorite}">${favorite ? '⭐' : '☆'}</button>
            </div>
        </article>`;
    }

    function createFavoriteProcedureCard(procedure) {
        const favoriteId = getProcedureFavoriteId(procedure);
        const favorite = window.Favorites?.isFavorite(favoriteId) || false;
        return `<article class="card procedure-card favorite-procedure-card">
            <div class="card-icon" aria-hidden="true">${procedure.icon}</div>
            <h3>${procedure.title}</h3>
            <p>${procedure.description}</p>
            <div class="tool-card-actions procedure-card-actions">
                <a class="btn" href="${procedure.sourceUrl}" target="_blank" rel="noopener noreferrer">فتح المنصة</a>
                <button class="fav-btn" type="button" data-id="${favoriteId}" aria-label="${favorite ? 'إزالة من المفضلة' : 'إضافة المنصة إلى المفضلة'}" aria-pressed="${favorite}">${favorite ? '⭐' : '☆'}</button>
            </div>
            <small>آخر تحقق: ${procedure.lastVerified} — ${procedure.availabilityStatus}</small>
        </article>`;
    }

    function renderTools(container, tools, emptyMessage = 'لا توجد أدوات مطابقة.') {
        container.innerHTML = tools.length ? tools.map(createToolCard).join('') : `<p class="empty-state">${emptyMessage}</p>`;
    }

    function createCategoryCard(category) {
        const url = resolveUrl(`/pages/tools.html?category=${encodeURIComponent(category.id)}`);
        return `<article class="card category-card" id="${category.id}">
            <div class="card-icon" aria-hidden="true">${category.icon}</div>
            <h4>${category.name}</h4><p>${category.description}</p>
            <a href="${url}" class="btn category-link">عرض أدوات القسم</a>
        </article>`;
    }

    async function initPage() {
        try {
            const [tools, categories, procedures] = await Promise.all([getTools(), getCategories(), getProcedures()]);
            window.TOOLS_DATA = tools;
            const categoriesContainer = document.getElementById('categories-container');
            if (categoriesContainer) categoriesContainer.innerHTML = categories.map(createCategoryCard).join('');
            const popularContainer = document.getElementById('popular-tools-container');
            if (popularContainer) renderTools(popularContainer, tools.filter(tool => tool.featured));
            const newContainer = document.getElementById('new-tools-container');
            if (newContainer) renderTools(newContainer, tools.filter(tool => tool.new));

            const allContainer = document.getElementById('all-tools-container');
            if (allContainer) {
                const categoryId = new URLSearchParams(window.location.search).get('category');
                const selectedCategory = categories.find(category => category.id === categoryId);
                renderTools(allContainer, selectedCategory ? tools.filter(tool => tool.category === selectedCategory.id) : tools,
                    'لا توجد أدوات في هذا التصنيف حاليًا.');
                const pageTitle = document.getElementById('tools-page-title');
                if (pageTitle && selectedCategory) pageTitle.textContent = selectedCategory.name;
            }

            const favoritesContainer = document.getElementById('favorites-container');
            if (favoritesContainer && window.Favorites) {
                const ids = window.Favorites.getAll();
                const favoriteTools = tools.filter(tool => ids.includes(tool.id)).map(createToolCard);
                const favoriteProcedures = procedures
                    .filter(procedure => ids.includes(getProcedureFavoriteId(procedure)))
                    .map(createFavoriteProcedureCard);
                const favoriteCards = [...favoriteTools, ...favoriteProcedures];
                favoritesContainer.innerHTML = favoriteCards.length
                    ? favoriteCards.join('')
                    : '<p class="empty-state">لا توجد عناصر في المفضلة حاليًا. أضف الأدوات والمنصات التي تستخدمها كثيرًا لتجدها هنا بسرعة.</p>';
            }
            window.initSearch?.(tools, procedures);
        } catch (error) {
            console.error('Failed to initialize tool registry', error);
            document.querySelectorAll('#categories-container, #popular-tools-container, #new-tools-container, #all-tools-container, #favorites-container').forEach(container => {
                container.innerHTML = '<p class="empty-state error-state">تعذر تحميل البيانات. تحقق من الاتصال ثم أعد المحاولة.</p>';
            });
        }
    }

    document.addEventListener('click', event => {
        const button = event.target.closest('.fav-btn');
        if (!button || !window.Favorites) return;
        const isFavorite = window.Favorites.toggle(button.dataset.id);
        button.textContent = isFavorite ? '⭐' : '☆';
        button.setAttribute('aria-pressed', String(isFavorite));
        button.setAttribute('aria-label', isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة');
        if (!isFavorite && button.closest('#favorites-container')) {
            button.closest('.tool-card, .procedure-card')?.remove();
            const container = document.getElementById('favorites-container');
            if (container && !container.querySelector('.tool-card, .procedure-card')) {
                container.innerHTML = '<p class="empty-state">لا توجد عناصر في المفضلة حاليًا. أضف الأدوات والمنصات التي تستخدمها كثيرًا لتجدها هنا بسرعة.</p>';
            }
        }
    });

    window.ToolRegistry = { getTools, getCategories, getProcedures, createToolCard, renderTools };
    document.addEventListener('DOMContentLoaded', initPage);
})();
