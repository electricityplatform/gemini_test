// =====================================================================
// ui/components.js — مكونات HTML صغيرة بتتكرر في كل الشاشات
// =====================================================================
Object.assign(UI, {
    esc: v => Actions.esc(v),

    // زرار: { label, icon, kind: primary|success|warning|danger|soft|ghost, action, args, id, title, hideLabelOnMobile }
    btn({ label = '', icon = '', kind = 'ghost', action = '', args = [], id = '', title = '', grow = false, hideLabelOnMobile = false } = {}) {
        return `<button type="button" ${id ? `id="${UI.esc(id)}"` : ''} ${action ? Actions.attr(action, ...args) : ''}
            ${title ? `title="${UI.esc(title)}" aria-label="${UI.esc(title)}"` : ''}
            class="btn btn-${kind}${grow ? ' btn-grow' : ''}">${icon ? UI.icon(icon) : ''}${label ? `<span class="${hideLabelOnMobile ? 'btn-label-hide-sm' : ''}">${UI.esc(label)}</span>` : ''}</button>`;
    },

    backButton(action, args = [], label = 'رجوع') {
        return UI.btn({ label, icon: 'back', kind: 'ghost', action, args }).replace('<svg ', '<svg style="transform:rotate(180deg)" ');
    },

    // كارت قائمة (ماركات / عناصر مركز البيانات...) — كله escape + data-action
    listCard(label, action, args = [], id = '') {
        return `<button type="button" ${id ? `id="${UI.esc(id)}"` : ''} ${Actions.attr(action, ...args)} class="list-card">
            <span dir="auto">${UI.esc(label)}</span>${UI.icon('chevron')}
        </button>`;
    },

    // قائمة "المزيد": items = [{ label, icon, action, args, id, labelId }]
    moreMenu(items) {
        return `<details class="menu">
            <summary class="btn btn-ghost" aria-label="المزيد">${UI.icon('more')}<span>المزيد</span></summary>
            <div class="menu-panel">
                ${items.map(i => `<button type="button" class="menu-item" ${i.id ? `id="${UI.esc(i.id)}"` : ''} ${Actions.attr(i.action, ...(i.args || []))}>
                    ${UI.icon(i.icon)}<span ${i.labelId ? `id="${UI.esc(i.labelId)}"` : ''}>${UI.esc(i.label)}</span></button>`).join('')}
            </div>
        </details>`;
    },

    skeleton(rows = 6) {
        return `<div class="skeleton-rows" aria-busy="true" aria-label="جاري التحميل">${'<div class="skeleton skeleton-row"></div>'.repeat(rows)}</div>`;
    },

    state(message, kind = '') {
        return `<div class="state ${kind === 'error' ? 'state-error' : ''}">${UI.esc(message)}</div>`;
    },

    // اسم المستخدم في الهيدر
    userChip() {
        if (!currentUserId || !currentUserName) return '';
        return `<div class="user-chip" dir="auto">
            <span class="role">${UI.esc(currentUserRole || '')}</span><span class="sep">|</span>
            <span class="name">${UI.esc(currentUserName)}</span><span class="sep">|</span>
            <span dir="ltr" style="font-family:var(--font-mono);color:var(--text-muted)">${UI.esc(currentUserPhone || '')}</span>
        </div>`;
    }
});

// أي شاشة جديدة بتتحط في appContainer بتظهر بحركة ناعمة (حتى الشاشات القديمة)
document.addEventListener('DOMContentLoaded', () => {
    const host = document.getElementById('appContainer');
    if (!host || !window.MutationObserver) return;
    new MutationObserver(() => {
        host.classList.remove('screen-enter');
        void host.offsetWidth;
        host.classList.add('screen-enter');
    }).observe(host, { childList: true });
});
