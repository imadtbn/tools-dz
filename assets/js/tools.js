(function () {
    'use strict';
    let toolsPromise;
    let categoriesPromise;

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
            const [tools, categories] = await Promise.all([getTools(), getCategories()]);
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
                const ids = Favorites.getAll();
                renderTools(favoritesContainer, tools.filter(tool => ids.includes(tool.id)),
                    'لا توجد أدوات في المفضلة حاليًا. أضف ما تستخدمه كثيرًا لتجده هنا بسرعة.');
            }
            window.initSearch?.(tools);
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
        const isFavorite = Favorites.toggle(button.dataset.id);
        button.textContent = isFavorite ? '⭐' : '☆';
        button.setAttribute('aria-pressed', String(isFavorite));
        button.setAttribute('aria-label', isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة');
        if (!isFavorite && button.closest('#favorites-container')) {
            button.closest('.tool-card')?.remove();
            const container = document.getElementById('favorites-container');
            if (container && !container.querySelector('.tool-card')) container.innerHTML = '<p class="empty-state">لا توجد أدوات في المفضلة حاليًا.</p>';
        }
    });

    window.ToolRegistry = { getTools, getCategories, createToolCard, renderTools };
    document.addEventListener('DOMContentLoaded', initPage);
})();
