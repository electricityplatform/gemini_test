// =====================================================================
// ui/sheet-factory.js — مصنع الشيتات
//
// بدل ملف 300 سطر لكل جدول، كل جدول بقى تعريف (config) صغير:
//
//   Sheets.define({
//       id: 'brands',
//       title: () => 'جدول الماركات',
//       rpc: { get, update, insert, insertAt, remove },
//       colLabel: (col) => ...,
//       searchRe: /^brand_names$/,
//   });
//   Sheets.open('brands');            // شيت عادي
//   Sheets.open('models');            // perBrand: بيفتح شاشة اختيار الماركة الأول
//
// خيارات التعريف:
//   perBrand        : الجدول بيتكرر لكل ماركة (بيتبعت p_brand تلقائياً)
//   updateOnly      : تعديل بس (من غير إضافة/إدراج/حذف). اسم الموديل (keyCol) بيتعرض للقراءة بس
//   rowActions      : 'all' | 'managers' | 'none'  (مين يشوف أزرار إدراج/حذف)
//   keyCol(ctx)     : العمود المميز اللي بيتثبت على الجنب
//   searchRe        : RegExp على أسماء الأعمدة اللي البحث بيدوّر فيها
//   fallbackColumns : async(ctx) => [أعمدة] لو الجدول فاضي ومفيش أعمدة جاية من السيرفر
// =====================================================================
const Sheets = (() => {
    const defs = Object.create(null);
    let active = null;      // { def, ctx, columns, rows, canManage, token }
    let tokenSeq = 0;

    const TABLE = 'sheetTable';
    const $ = id => document.getElementById(id);

    // ---------- تعريف ----------
    function define(def) {
        defs[def.id] = Object.assign({
            readonly: ['id', 'created_at', 'updated_at'],
            perBrand: false,
            updateOnly: false,
            rowActions: 'all',
            searchPlaceholder: 'بحث',
            loadingRows: 6,
            notFound: 'الجدول غير موجود',
            colLabel: () => '',
            keyCol: null,
            searchRe: null,
            fallbackColumns: null,
            pickerTitle: 'اختر الماركة',
            exportPrefix: def.id
        }, def);
    }

    const paramsOf = (def, ctx) => (def.perBrand ? { p_brand: ctx.brand } : {});

    // ---------- الدخول ----------
    function open(id, brandKey, brandLabel) {
        const def = defs[id];
        if (!def) return console.warn('Sheet غير معرّف:', id);
        if (def.perBrand && !brandKey) return renderPicker(def);
        return renderSheet(def, { brand: brandKey || '', label: brandLabel || '' });
    }

    function goBack() {
        if (active && active.def.perBrand) return renderPicker(active.def);
        return renderDataCenterScreen();
    }

    // ---------- شاشة اختيار الماركة ----------
    function renderPicker(def) {
        closeSidebar();
        active = null;
        $('appContainer').innerHTML = `
            ${getHeaderTemplate()}
            <div class="toolbar">
                <div class="toolbar-group">${UI.backButton('dc.home', [], 'رجوع لمركز البيانات')}</div>
                <h2 class="screen-title">${UI.esc(def.pickerTitle)}</h2>
            </div>
            <div class="list">
                ${DATA_CENTER_BRANDS.map(b => UI.listCard(b.label, 'sheet.open', [def.id, b.key, b.label])).join('')}
            </div>`;
        loadDynamicMenuIntoSidebar();
    }

    // ---------- الصلاحيات ----------
    function canManageRows(def) {
        if (def.updateOnly || def.rowActions === 'none') return false;
        return def.rowActions === 'managers' ? isDataCenterRowManager() : true;
    }

    // ---------- أزرار الصف ----------
    function rowActionsHtml(id) {
        const n = Number(id);
        if (!Number.isFinite(n)) return '<td class="sheet-actions"></td>';
        return `<td class="sheet-actions"><div>
            <button type="button" ${Actions.attr('sheet.insertAt', n)} class="btn btn-sm btn-chip-warning" title="إدراج صف جديد مكان هذا الصف (وهو وما بعده ينزلوا خطوة)">+ إدراج</button>
            <button type="button" ${Actions.attr('sheet.remove', n)} class="btn btn-sm btn-chip-danger" title="حذف هذا الصف">حذف</button>
        </div></td>`;
    }

    // ---------- رسم الشيت ----------
    async function renderSheet(def, ctx) {
        closeSidebar();
        const token = ++tokenSeq;
        active = { def, ctx, columns: [], rows: [], canManage: canManageRows(def), token };

        const baseTitle = def.title(ctx);
        const menuItems = [
            { label: 'تحديث', icon: 'refresh', action: 'sheet.refresh' },
            { label: 'تصدير إلى إكسل', icon: 'download', action: 'sheet.export' }
        ];
        if (def.keyCol) menuItems.push({ label: 'تثبيت العمود المميز', icon: 'pin', action: 'sheet.pin', id: 'keyPinBtn', labelId: 'keyPinLabel' });

        $('appContainer').innerHTML = `
            ${getHeaderTemplate()}
            <div class="toolbar">
                <div class="toolbar-group">
                    ${UI.backButton('sheet.back', [], def.perBrand ? 'رجوع للماركات' : 'رجوع لمركز البيانات')}
                    ${def.updateOnly ? '' : UI.btn({ label: 'إضافة صف', icon: 'plus', kind: 'warning', action: 'sheet.add' })}
                    ${UI.btn({ label: 'حفظ التعديلات', icon: 'save', kind: 'success', action: 'sheet.save', grow: true })}
                    ${UI.moreMenu(menuItems)}
                </div>
                <h2 id="sheetTitle" class="screen-title">${UI.esc(baseTitle)}</h2>
            </div>
            <input id="sheetSearchInput" type="text" ${Actions.inputAttr('sheet.filter')} placeholder="${UI.esc(def.searchPlaceholder)}" class="input" style="margin-bottom:8px;flex-shrink:0" dir="auto">
            <div id="sheetSearchCount" class="search-count" hidden></div>
            <div id="sheetContainer" class="sheet-wrap">${UI.skeleton(def.loadingRows)}</div>`;

        loadDynamicMenuIntoSidebar();
        await load(token);
    }

    async function load(token) {
        const { def, ctx } = active;
        const box = $('sheetContainer');
        const { data, error } = await Api.rpc(def.rpc.get, paramsOf(def, ctx));
        if (!active || active.token !== token || !box || !box.isConnected) return;   // المستخدم مشي من الشاشة

        if (error) { box.innerHTML = UI.state('خطأ في جلب البيانات: ' + error, 'error'); return; }

        // الرد: { columns, rows } وبندعم كمان الشكل القديم (مصفوفة صفوف)
        let rows = [], columns = [];
        if (Array.isArray(data)) rows = data;
        else if (data && typeof data === 'object') {
            rows = Array.isArray(data.rows) ? data.rows : [];
            columns = Array.isArray(data.columns) ? data.columns : [];
        }
        if (!columns.length && rows.length) columns = Object.keys(rows[0]);
        if (!columns.length && def.fallbackColumns) columns = await def.fallbackColumns(ctx);
        if (!active || active.token !== token || !box.isConnected) return;
        if (!columns.length) { box.innerHTML = UI.state(def.notFound, 'error'); return; }

        active.rows = rows;
        active.columns = columns;
        $('sheetTitle').textContent = `${def.title(ctx)} (${rows.length})`;
        box.innerHTML = tableHtml(def, ctx, columns, rows);

        const table = $(TABLE);
        const keyCol = def.keyCol ? def.keyCol(ctx) : '';
        if (!def.updateOnly) table.addRowFn = addRow;
        if (keyCol) applyKeyPinState(table, keyCol);
        enableExcelPasteAndDragFill();
        if (!def.updateOnly && rows.length === 0) addRow(false);
    }

    function tableHtml(def, ctx, columns, rows) {
        const keyCol = def.keyCol ? def.keyCol(ctx) : '';
        const lockKey = def.updateOnly && keyCol;
        const hasActions = active.canManage;

        const cell = (col, val) => {
            if (lockKey && col === keyCol) return `<td class="relative"><span class="cell-name" dir="auto">${UI.esc(val)}</span></td>`;
            if (def.readonly.includes(col)) return sheetReadonlyCellHtml(val);
            return `<td class="relative">${sheetCellInputHtml(col, val)}<div class="drag-handle" title="اسحب للتعبئة التلقائية"></div></td>`;
        };

        return `<table id="${TABLE}">
            <thead><tr>
                ${columns.map(c => sheetThHtml(c, def.colLabel(c, ctx))).join('')}
                ${hasActions ? '<th class="sheet-actions-th">إجراءات</th>' : ''}
                ${sheetIdDupThHtml()}
            </tr></thead>
            <tbody>
                ${rows.map(row => `<tr data-id="${UI.esc(row.id)}"${lockKey ? ` data-name="${UI.esc(row[keyCol])}"` : ''}>
                    ${columns.map(c => cell(c, row[c] ?? '')).join('')}
                    ${hasActions ? rowActionsHtml(row.id) : ''}
                    ${sheetIdDupCellHtml(row.id)}
                </tr>`).join('')}
            </tbody>
        </table>`;
    }

    // ---------- إضافة / إدراج ----------
    function addRow(focus = true) {
        if (!active || active.def.updateOnly) return null;
        const extra = active.canManage ? '<td class="sheet-actions"></td>' : '';
        return appendBlankSheetRow(active.columns, active.def.readonly, focus, extra, true);
    }

    // الصف بيظهر قبل الصف المختار فوراً، والإدراج الفعلي في الداتابيز وقت "حفظ"
    function insertAt(position) {
        if (!active) return;
        if (!isDataCenterRowManager() && active.def.rowActions === 'managers') {
            return UI.toast('هذا الإجراء للأدمن والمدير فقط', 'warning');
        }
        const tbody = $(TABLE) && $(TABLE).querySelector('tbody');
        const target = tbody && tbody.querySelector(`tr[data-id="${Number(position)}"]`);
        if (!target) return UI.toast('مش لاقي الصف ده، دوس تحديث وجرب تاني', 'warning');

        const before = new Set(Array.from(tbody.children));
        addRow(false);
        const newRow = Array.from(tbody.children).find(tr => !before.has(tr));
        if (!newRow) return;

        newRow.setAttribute('data-insert-at', String(position));
        tbody.insertBefore(newRow, target);
        newRow.classList.add('is-inserted');
        const first = newRow.querySelector('.excel-input');
        if (first) first.focus();
        newRow.scrollIntoView({ block: 'center' });
    }

    // ---------- حذف ----------
    async function remove(id) {
        if (!active) return;
        const { def, ctx, rows, columns } = active;
        const labelCol = columns.find(c => !def.readonly.includes(c));
        const row = rows.find(r => String(r.id) === String(id));
        const firstVal = row && labelCol ? row[labelCol] : '';
        const label = firstVal ? `"${firstVal}" (رقم ${id})` : `رقم ${id}`;

        const ok = await UI.confirm({
            title: 'حذف صف',
            message: `هتحذف الصف ${label} نهائياً.\nالأرقام اللي بعده هترجع خطوة لورا.\nالشيت هيتحدّث بعد الحذف، فاحفظ أي تعديلات أخرى الأول.`,
            okText: 'حذف', danger: true
        });
        if (!ok) return;

        const res = await Api.mutate(def.rpc.remove, { ...paramsOf(def, ctx), p_id: Number(id) }, 'فشل الحذف');
        if (!res.ok) return UI.toast((res.error ? 'حدث خطأ أثناء الحذف: ' : '') + res.message, 'error');
        UI.toast('تم حذف الصف', 'success');
        await renderSheet(def, ctx);
    }

    // ---------- حفظ ----------
    async function save() {
        const table = $(TABLE);
        if (!table || !active) return;
        const { def, ctx } = active;
        const params = paramsOf(def, ctx);
        const keyCol = def.keyCol ? def.keyCol(ctx) : '';

        // ===== شيتات التعديل فقط: بنبعت بس الخلايا اللي اتغيّرت فعلاً =====
        if (def.updateOnly) {
            const payload = [], changedInputs = [];
            table.querySelectorAll('tbody tr[data-id]').forEach(row => {
                const rowData = { id: row.getAttribute('data-id'), [keyCol]: row.getAttribute('data-name') };
                let changed = false;
                row.querySelectorAll('[data-field]').forEach(input => {
                    const raw = input.value.trim();
                    if (raw === (input.defaultValue || '').trim()) return;
                    rowData[input.getAttribute('data-field')] = raw !== '' ? raw : null;
                    changedInputs.push(input);
                    changed = true;
                });
                if (changed) payload.push(rowData);
            });
            if (!payload.length) return UI.toast('لا توجد تعديلات للحفظ', 'warning');

            const res = await Api.mutate(def.rpc.update, { ...params, p_payload: payload }, 'فشل حفظ التعديلات');
            if (!res.ok) return UI.toast((res.error ? 'حدث خطأ أثناء حفظ التعديلات: ' : '') + res.message, 'error');
            changedInputs.forEach(i => { i.defaultValue = i.value; });
            return UI.toast(res.message || 'تم حفظ التعديلات', 'success');
        }

        // ===== الشيتات العادية: تعديل الموجود + إدراج في أماكن + إضافة الجديد =====
        const updatePayload = [], insertPayload = [], positional = [];
        table.querySelectorAll('tbody tr').forEach(row => {
            const inputs = row.querySelectorAll('[data-field]');
            if (row.hasAttribute('data-id')) {
                const rowData = { id: row.getAttribute('data-id') };
                inputs.forEach(i => { const v = i.value.trim(); rowData[i.getAttribute('data-field')] = v !== '' ? v : null; });
                updatePayload.push(rowData);
                return;
            }
            const rowData = {};
            let hasValue = false;
            inputs.forEach(i => {
                const v = i.value.trim();
                if (v !== '') { rowData[i.getAttribute('data-field')] = v; hasValue = true; }
            });
            if (!hasValue) return;                       // الصف الفاضي خالص مش بيتحفظ
            if (row.hasAttribute('data-insert-at')) positional.push({ position: Number(row.getAttribute('data-insert-at')), payload: rowData });
            else insertPayload.push(rowData);
        });

        if (!updatePayload.length && !insertPayload.length && !positional.length) return UI.toast('لا توجد بيانات للحفظ', 'warning');

        const messages = [];
        let reload = false;
        const withPrefix = msg => (messages.length ? messages.join('\n') + '\n\n' : '') + msg;
        const fail = async msg => {
            UI.toast(withPrefix(msg), 'error', 8000);
            if (reload) await renderSheet(def, ctx);
        };

        if (updatePayload.length) {
            const r = await Api.mutate(def.rpc.update, { ...params, p_payload: updatePayload }, 'فشل حفظ التعديلات');
            if (!r.ok) return UI.toast((r.error ? 'حدث خطأ أثناء حفظ التعديلات: ' : '') + r.message, 'error');
            messages.push(r.message || 'تم حفظ التعديلات');
        }

        // الإدراج في أماكن معينة: من الآخر للأول عشان أرقام الصفوف اللي فوق ما تتغيرش
        let insertedAt = 0;
        for (let i = positional.length - 1; i >= 0; i--) {
            const r = await Api.mutate(def.rpc.insertAt, { ...params, p_position: positional[i].position, p_payload: positional[i].payload }, 'فشل الإدراج');
            if (!r.ok) {
                reload = reload || insertedAt > 0;
                return fail('حدث خطأ أثناء إدراج صف جديد: ' + r.message + (insertedAt ? `\n\nاتدرج ${insertedAt} صف قبل الخطأ، والشيت هيتحدّث.` : ''));
            }
            insertedAt++;
        }
        if (insertedAt) { messages.push(`تم إدراج ${insertedAt} صف في مكانه`); reload = true; }

        if (insertPayload.length) {
            const r = await Api.mutate(def.rpc.insert, { ...params, p_payload: insertPayload }, 'فشلت إضافة الصفوف الجديدة');
            if (!r.ok) return fail((r.error ? 'حدث خطأ أثناء إضافة الصفوف الجديدة: ' : '') + r.message);
            messages.push(r.message || 'تمت إضافة الصفوف الجديدة');
            reload = true;
        }

        UI.toast(messages.join('\n'), 'success');
        if (reload) await renderSheet(def, ctx);        // عشان يظهر الـ id للصفوف الجديدة
    }

    // ---------- بحث ----------
    function filter(q) {
        const table = $(TABLE);
        if (!table || !active) return;
        const { def } = active;
        const norm = v => String(v ?? '').toLowerCase().replace(/\s+/g, '');
        const needle = norm(q);
        let visible = 0, total = 0;

        table.querySelectorAll('tbody tr').forEach(tr => {
            if (!tr.querySelector('.excel-input')) return;
            const hay = Array.from(tr.querySelectorAll('.excel-input'))
                .filter(i => !def.searchRe || def.searchRe.test(i.getAttribute('data-field') || ''))
                .map(i => i.value);
            if (tr.hasAttribute('data-name')) hay.push(tr.getAttribute('data-name'));
            total++;
            const match = !needle || hay.some(v => norm(v).includes(needle));
            tr.style.display = match ? '' : 'none';
            if (match) visible++;
        });

        const count = $('sheetSearchCount');
        if (count) { count.hidden = !needle; if (needle) count.textContent = `${visible} من ${total} صف`; }
    }

    // ---------- تصدير ----------
    function exportXlsx() {
        const table = $(TABLE);
        if (!table || !active) return UI.toast('لا توجد بيانات للتصدير حالياً', 'warning');
        const { def, ctx } = active;

        const headers = Array.from(table.querySelectorAll('thead th[data-col]')).map(th => th.getAttribute('data-col'));
        const data = [];
        table.querySelectorAll('tbody tr').forEach(row => {
            const isBlank = !row.hasAttribute('data-id') && !Array.from(row.querySelectorAll('.excel-input')).some(i => i.value.trim() !== '');
            if (isBlank) return;
            data.push(Array.from(row.querySelectorAll('td:not(.sheet-actions):not(.sheet-id-dup)')).map(td => {
                const input = td.querySelector('.excel-input');
                return input ? input.value : td.innerText.trim();
            }));
        });

        const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
        const wb = XLSX.utils.book_new();
        const name = def.perBrand ? `${ctx.brand}_${def.exportPrefix}` : def.exportPrefix;
        XLSX.utils.book_append_sheet(wb, ws, (def.perBrand ? ctx.brand : def.exportPrefix).slice(0, 31));
        XLSX.writeFile(wb, `${name}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }

    // ---------- ربط الأحداث ----------
    Actions.register({
        'sheet.open': (id, brand, label) => open(id, brand, label),
        'sheet.back': () => goBack(),
        'sheet.refresh': () => active && renderSheet(active.def, active.ctx),
        'sheet.add': () => addRow(true),
        'sheet.save': () => save(),
        'sheet.export': () => exportXlsx(),
        'sheet.pin': () => toggleKeyColumnPin(),
        'sheet.insertAt': n => insertAt(n),
        'sheet.remove': n => remove(n),
        'sheet.filter': q => filter(q)
    });

    return { define, open, defs };
})();
