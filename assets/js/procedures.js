(function () {
    'use strict';
    const STORAGE_KEY = 'tools_dz_procedure_progress';

    function loadProgress() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
        catch { return {}; }
    }

    function saveProgress(progress) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    }

    async function init() {
        const container = document.getElementById('procedures-container');
        if (!container) return;
        try {
            const [proceduresResponse, toolsResponse] = await Promise.all([
                fetch(resolveUrl('/data/procedures/procedures.json')),
                fetch(resolveUrl('/data/tools.json'))
            ]);
            if (!proceduresResponse.ok || !toolsResponse.ok) throw new Error('Data load failed');
            const procedures = await proceduresResponse.json();
            const tools = await toolsResponse.json();
            const toolMap = new Map(tools.map(tool => [tool.id, tool]));
            window.initSearch?.(tools, procedures);
            const progress = loadProgress();

            container.innerHTML = procedures.map(procedure => {
                const steps = procedure.steps.map((step, index) => {
                    const key = `${procedure.id}:${index}`;
                    return `<label class="procedure-step"><input type="checkbox" data-progress-key="${key}" ${progress[key] ? 'checked' : ''}><span>${step}</span></label>`;
                }).join('');
                const related = procedure.relatedTools.map(id => toolMap.get(id)).filter(Boolean)
                    .map(tool => `<a href="${resolveUrl(tool.url)}" class="procedure-tool">${tool.name}</a>`).join('');
                return `<article class="card procedure-card">
                    <div class="card-icon" aria-hidden="true">${procedure.icon}</div>
                    <h3>${procedure.title}</h3><p>${procedure.description}</p>
                    <div class="procedure-steps">${steps}</div>
                    <div class="procedure-tools"><strong>أدوات مساعدة:</strong>${related}</div>
                    <a class="btn" href="${procedure.sourceUrl}" target="_blank" rel="noopener noreferrer">فتح المنصة</a>
                    <small>فحص الرابط: ${procedure.lastVerified} — ${procedure.availabilityStatus}</small>
                </article>`;
            }).join('');

            container.addEventListener('change', event => {
                if (!event.target.matches('[data-progress-key]')) return;
                const next = loadProgress();
                next[event.target.dataset.progressKey] = event.target.checked;
                saveProgress(next);
            });
        } catch (error) {
            console.error(error);
            container.innerHTML = '<p class="empty-state error-state">تعذر تحميل الأدلة الآن. أعد المحاولة عند توفر الاتصال.</p>';
        }
    }
    document.addEventListener('DOMContentLoaded', init);
})();
