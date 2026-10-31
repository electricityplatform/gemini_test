// =====================================================================
// ui/toast.js — إشعارات (toast) ونافذة تأكيد، بدل alert / confirm بتوع المتصفح
//   UI.toast('تم الحفظ', 'success')
//   if (await UI.confirm({ title:'حذف', message:'متأكد؟', danger:true })) { ... }
// وكمان: window.alert بقى بيعرض toast، فالكود القديم اللي لسه بيستخدم alert() شكله اتحدّث.
// =====================================================================
Object.assign(UI, {
    guessKind(msg) {
        const s = String(msg || '');
        if (/خطأ|فشل|تعذر|⚠|❌/.test(s)) return 'error';
        if (/تم |تمت|نجاح|✅/.test(s)) return 'success';
        return 'info';
    },

    toast(message, kind = 'info', ms) {
        let host = document.getElementById('toastHost');
        if (!host) {
            host = document.createElement('div');
            host.id = 'toastHost';
            host.setAttribute('aria-live', 'polite');
            document.body.appendChild(host);
        }
        const el = document.createElement('div');
        el.className = `toast toast-${kind}`;
        el.setAttribute('role', kind === 'error' ? 'alert' : 'status');
        const iconName = kind === 'success' ? 'check' : kind === 'error' ? 'warn' : kind === 'warning' ? 'warn' : 'info';
        el.innerHTML = UI.icon(iconName) + '<span></span>';
        el.lastElementChild.textContent = String(message ?? '');   // textContent: آمن من الـHTML
        while (host.children.length >= 3) host.firstElementChild.remove();   // أقصى 3 إشعارات في نفس الوقت
        host.appendChild(el);

        const life = ms || Math.min(7000, 2600 + String(message || '').length * 40);
        const close = () => { el.classList.add('is-leaving'); setTimeout(() => el.remove(), 220); };
        const timer = setTimeout(close, life);
        el.addEventListener('click', () => { clearTimeout(timer); close(); });
    },

    confirm({ title = 'تأكيد', message = '', okText = 'تأكيد', cancelText = 'إلغاء', danger = false } = {}) {
        return new Promise(resolve => {
            const previouslyFocused = document.activeElement;
            const backdrop = document.createElement('div');
            backdrop.className = 'dialog-backdrop';
            backdrop.innerHTML = `
                <div class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dlgTitle">
                    <div class="dialog-title" id="dlgTitle"></div>
                    <div class="dialog-body"></div>
                    <div class="dialog-actions">
                        <button type="button" class="btn btn-ghost" data-r="0"></button>
                        <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-r="1"></button>
                    </div>
                </div>`;
            backdrop.querySelector('.dialog-title').textContent = title;
            backdrop.querySelector('.dialog-body').textContent = message;
            const [cancelBtn, okBtn] = backdrop.querySelectorAll('button');
            cancelBtn.textContent = cancelText;
            okBtn.textContent = okText;

            const done = val => {
                document.removeEventListener('keydown', onKey, true);
                backdrop.remove();
                if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
                resolve(val);
            };
            const onKey = e => {
                if (e.key === 'Escape') { e.preventDefault(); done(false); }
            };
            backdrop.addEventListener('click', e => {
                if (e.target === backdrop) return done(false);
                const b = e.target.closest('button[data-r]');
                if (b) done(b.dataset.r === '1');
            });
            document.addEventListener('keydown', onKey, true);
            document.body.appendChild(backdrop);
            cancelBtn.focus();
        });
    }
});

window._nativeAlert = window.alert.bind(window);
window.alert = function (message) { UI.toast(message, UI.guessKind(message)); };

Actions.register('toast', msg => UI.toast(msg));
