// =====================================================================
// core/actions.js — Event delegation بدل onclick="..." المكتوبة كنصوص
//
//   تسجيل:   Actions.register('sheet.save', () => {...})
//   في الـHTML: <button ${Actions.attr('sheet.save')}>  أو  ${Actions.attr('open', 'apple', 'أبل')}
//   البحث:   <input ${Actions.inputAttr('sheet.filter')}>   (الدالة بتستقبل القيمة)
//
//   الوسائط بتتخزن JSON متهرّب، فأي اسم فيه ' أو " أو \ مش بيكسر حاجة.
// =====================================================================
const Actions = (() => {
    const registry = Object.create(null);

    const esc = v => String(v ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    function register(nameOrMap, fn) {
        if (typeof nameOrMap === 'object') {
            Object.entries(nameOrMap).forEach(([k, f]) => { registry[k] = f; });
        } else {
            registry[nameOrMap] = fn;
        }
    }

    function attr(name, ...args) {
        return `data-action="${esc(name)}"` + (args.length ? ` data-args="${esc(JSON.stringify(args))}"` : '');
    }

    function inputAttr(name, ...args) {
        return `data-input-action="${esc(name)}"` + (args.length ? ` data-args="${esc(JSON.stringify(args))}"` : '');
    }

    function readArgs(el) {
        try { return el.dataset.args ? JSON.parse(el.dataset.args) : []; } catch (e) { return []; }
    }

    document.addEventListener('click', e => {
        const el = e.target.closest('[data-action]');
        if (!el || el.disabled) return;
        const fn = registry[el.dataset.action];
        if (!fn) { console.warn('Action غير مسجّل:', el.dataset.action); return; }
        const menu = el.closest('details.menu');
        if (menu) menu.open = false;
        fn(...readArgs(el), el, e);
    });

    document.addEventListener('input', e => {
        const el = e.target.closest('[data-input-action]');
        if (!el) return;
        const fn = registry[el.dataset.inputAction];
        if (fn) fn(el.value, ...readArgs(el), el);
    });

    // إغلاق قوائم "المزيد" لما تدوس برّاها
    document.addEventListener('click', e => {
        document.querySelectorAll('details.menu[open]').forEach(d => { if (!d.contains(e.target)) d.open = false; });
    });

    return { register, attr, inputAttr, esc };
})();
