// ================= شاشة مركز البيانات =================
async function renderDataCenterScreen() {
    closeSidebar();

    const container = document.getElementById('appContainer');
    container.innerHTML = `
        ${getHeaderTemplate()}
        <div class="flex items-center justify-between mb-4 flex-shrink-0 flex-wrap gap-2">
            <div class="flex items-center gap-2">
                <button type="button" onclick="renderMainDashboard()" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer">
                    <svg class="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                    <span>رجوع</span>
                </button>
                <button type="button" onclick="fetchAndDisplayDataCenterMenu();" class="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 border border-blue-200 cursor-pointer" title="تحديث البيانات">
                    <svg class="w-4 h-4 transform transition-transform hover:rotate-180 duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    <span>تحديث</span>
                </button>
            </div>
            <h2 class="text-sm sm:text-base font-bold text-gray-800 flex items-center gap-2">
                <span class="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>
                مركز البيانات
            </h2>
        </div>

        <div id="dataCenterContainer" class="flex-1 overflow-y-auto space-y-3 p-1">
            <div class="text-center text-gray-400 text-sm py-8">جاري جلب عناصر مركز البيانات...</div>
        </div>
    `;

    loadDynamicMenuIntoSidebar();
    await fetchAndDisplayDataCenterMenu();
}

async function fetchAndDisplayDataCenterMenu() {
    const dataCenterContainer = document.getElementById('dataCenterContainer');
    if (!dataCenterContainer) return;

    dataCenterContainer.innerHTML = `<div class="text-center text-gray-400 text-sm py-8">جاري التحديث...</div>`;

    try {
        const { data, error } = await supabaseClient.rpc('get_data_center_menu', {
            p_user_id: currentUserId
        });

        if (error) {
            dataCenterContainer.innerHTML = `<div class="text-center text-red-400 text-sm py-8">خطأ في جلب البيانات: ${error.message}</div>`;
            return;
        }

        let itemsList = [];
        if (Array.isArray(data)) {
            itemsList = data;
        } else if (typeof data === 'string') {
            try { itemsList = JSON.parse(data); } catch(e){}
        }

        if (itemsList.length > 0) {
            dataCenterContainer.innerHTML = itemsList.map((item, index) => {
                const style = getRotatingCardStyle(index);
                let clickAction = `alert('تم النقر على قسم: ${item}')`;

                if (item.includes('جدول المستخدمين') || item.includes('بيانات المستخدمين')) {
                    clickAction = "renderUsersDataCenterSheet()";
                } else if (item.includes('جداول الموديلات') || item.includes('الموديلات')) {
                    clickAction = "renderDataCenterBrandsScreen()";
                }

                return `
                    <div onclick="${clickAction}" class="w-full ${style.bg} border ${style.border} p-4 rounded-2xl shadow-sm flex items-center justify-between cursor-pointer transition-all text-sm sm:text-base group">
                        <span class="font-bold text-gray-800" dir="auto">${item}</span>
                        <svg class="w-5 h-5 ${style.icon} flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                    </div>
                `;
            }).join('');
        } else {
            dataCenterContainer.innerHTML = `<div class="text-center text-gray-500 py-12 bg-gray-50 rounded-2xl border border-gray-200"><p class="font-semibold">لا توجد عناصر متاحة أو ليس لديك صلاحية العرض</p></div>`;
        }

    } catch (err) {
        console.error(err);
        dataCenterContainer.innerHTML = `<div class="text-center text-red-400 text-sm py-8">حدث خطأ غير متوقع</div>`;
    }
}

// ================= شيت جدول المستخدمين (النمط الشبكي لإكسل) =================
async function renderUsersDataCenterSheet() {
    closeSidebar();

    const container = document.getElementById('appContainer');
    container.innerHTML = `
        ${getHeaderTemplate()}
        <div class="flex items-center justify-between mb-3 flex-shrink-0 flex-wrap gap-2">
            <div class="flex items-center gap-2 flex-wrap">
                <button type="button" onclick="renderDataCenterScreen()" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer">
                    <svg class="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                    <span>رجوع لمركز البيانات</span>
                </button>
                <button type="button" onclick="saveUsersDataCenterSheetToDB()" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                    <span>حفظ التعديلات لقاعدة البيانات</span>
                </button>
                <button type="button" onclick="exportUsersSheetToExcel()" class="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    <span>تصدير إلى إكسل</span>
                </button>
            </div>
            <h2 class="text-sm sm:text-base font-bold text-gray-800">شيت جدول المستخدمين (النمط الشبكي لإكسل)</h2>
        </div>

        <div id="usersSheetContainer" class="flex-1 overflow-y-auto p-1 border border-slate-300 rounded-xl bg-white shadow-inner">
            <div class="text-center text-gray-400 text-sm py-8">جاري جلب بيانات المستخدمين كشيت...</div>
        </div>
    `;

    loadDynamicMenuIntoSidebar();
    await loadUsersDataIntoSheetGrid();
}

async function loadUsersDataIntoSheetGrid() {
    const sheetContainer = document.getElementById('usersSheetContainer');
    if (!sheetContainer) return;

    try {
        const { data, error } = await supabaseClient.rpc('get_users_for_data_center', {
            p_user_id: currentUserId
        });

        if (error) {
            sheetContainer.innerHTML = `<div class="text-center text-red-400 text-sm py-8">خطأ في جلب البيانات: ${error.message}</div>`;
            return;
        }

        let usersList = [];
        if (Array.isArray(data)) {
            usersList = data;
        } else if (typeof data === 'string') {
            try { usersList = JSON.parse(data); } catch(e){}
        }

        if (usersList.length > 0) {
            const sampleObj = usersList[0];
            const columns = Object.keys(sampleObj);

            sheetContainer.innerHTML = `
                <table id="editableUsersTable">
                    <thead>
                        <tr>
                            ${columns.map(col => `<th>${col}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${usersList.map((user, idx) => `
                            <tr data-id="${user.id}">
                                ${columns.map(col => {
                                    const val = user[col] !== null && user[col] !== undefined ? user[col] : '';
                                    const isId = (col === 'id' || col === 'created_at' || col === 'last_active_at');
                                    if (isId) {
                                        return `<td class="p-2 font-mono text-slate-500 text-xs whitespace-nowrap min-w-[150px]" dir="ltr">${val}</td>`;
                                    }
                                    return `
                                        <td class="min-w-[160px] h-[38px] relative">
                                            <input type="text" data-field="${col}" value="${val}" class="excel-input" dir="auto">
                                            <div class="drag-handle" title="اسحب للتعبئة التلقائية"></div>
                                        </td>
                                    `;
                                }).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

            enableExcelPasteAndDragFill();

        } else {
            sheetContainer.innerHTML = `<div class="text-center text-gray-500 py-12">لا توجد بيانات مستخدمين متاحة</div>`;
        }
    } catch (err) {
        console.error(err);
        sheetContainer.innerHTML = `<div class="text-center text-red-400 text-sm py-8">حدث خطأ غير متوقع</div>`;
    }
}

// ================= تصدير الشيت إلى XLSX =================
function exportUsersSheetToExcel() {
    const table = document.getElementById('editableUsersTable');
    if (!table) {
        alert("لا توجد بيانات للتصدير حالياً");
        return;
    }

    // 1. عناوين الأعمدة
    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.innerText.trim());

    // 2. بيانات الصفوف من الـ Inputs الحالية
    const rowsData = [];
    const rows = table.querySelectorAll('tbody tr');

    rows.forEach(row => {
        const rowData = [];
        const cells = row.querySelectorAll('td');

        cells.forEach(td => {
            const input = td.querySelector('input.excel-input');
            const val = input ? input.value : td.innerText.trim();
            rowData.push(val);
        });

        rowsData.push(rowData);
    });

    // 3. تجميع البيانات
    const excelData = [headers, ...rowsData];

    // 4. إنشاء الملف
    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "جدول المستخدمين");

    // 5. التحميل
    const fileName = `Users_Sheet_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
}

// ================= ميزات الإكسل (اللصق المتعدد والسحب للتعبئة) =================
function enableExcelPasteAndDragFill() {
    const table = document.getElementById('editableUsersTable');
    if (!table) return;

    const inputs = table.querySelectorAll('input.excel-input');

    // 1. اللصق الجماعي (Multi-cell Paste)
    inputs.forEach(input => {
        input.addEventListener('paste', function(e) {
            e.preventDefault();
            const clipboardData = e.clipboardData || window.clipboardData;
            const pastedData = clipboardData.getData('Text');
            if (!pastedData) return;

            const rowsData = pastedData.split(/\r\n|\n|\r/).filter(row => row !== '');
            if (rowsData.length === 0) return;

            const currentRow = this.closest('tr');
            const currentCell = this.closest('td');
            const allRows = Array.from(table.querySelectorAll('tbody tr'));
            const startRowIndex = allRows.indexOf(currentRow);
            const allCellsInRow = Array.from(currentRow.querySelectorAll('td'));
            const startCellIndex = allCellsInRow.indexOf(currentCell);

            rowsData.forEach((rowText, rIdx) => {
                const targetRow = allRows[startRowIndex + rIdx];
                if (!targetRow) return;

                const colsData = rowText.split('\t');
                colsData.forEach((cellText, cIdx) => {
                    const targetCells = Array.from(targetRow.querySelectorAll('td'));
                    const targetCell = targetCells[startCellIndex + cIdx];
                    if (!targetCell) return;

                    const targetInput = targetCell.querySelector('input.excel-input');
                    if (targetInput) {
                        targetInput.value = cellText.trim();
                    }
                });
            });
        });
    });

    // 2. السحب للتعبئة (Drag Fill Handle)
    const handles = table.querySelectorAll('.drag-handle');
    handles.forEach(handle => {
        handle.addEventListener('mousedown', function(e) {
            e.preventDefault();
            const sourceCell = this.closest('td');
            const sourceInput = sourceCell.querySelector('input.excel-input');
            const sourceRow = sourceCell.closest('tr');
            const allRows = Array.from(table.querySelectorAll('tbody tr'));
            const sourceRowIndex = allRows.indexOf(sourceRow);
            const sourceCellIndex = Array.from(sourceRow.querySelectorAll('td')).indexOf(sourceCell);
            const sourceVal = sourceInput ? sourceInput.value : sourceCell.innerText;

            function onMouseMove(moveEvent) {
                const elemBelow = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
                const targetCellBelow = elemBelow?.closest('td');
                if (targetCellBelow) {
                    const targetRow = targetCellBelow.closest('tr');
                    const targetRowIndex = allRows.indexOf(targetRow);
                    const targetCellIndex = Array.from(targetRow.querySelectorAll('td')).indexOf(targetCellBelow);

                    if (targetCellIndex === sourceCellIndex && targetRowIndex >= sourceRowIndex) {
                        for (let i = sourceRowIndex; i <= targetRowIndex; i++) {
                            const rowCells = Array.from(allRows[i].querySelectorAll('td'));
                            const inputToFill = rowCells[sourceCellIndex]?.querySelector('input.excel-input');
                            if (inputToFill) {
                                inputToFill.value = sourceVal;
                            }
                        }
                    }
                }
            }

            function onMouseUp() {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            }

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    });
}

// ================= حفظ الشيت في قاعدة البيانات =================
async function saveUsersDataCenterSheetToDB() {
    const table = document.getElementById('editableUsersTable');
    if (!table) return;

    const rows = table.querySelectorAll('tbody tr');
    const payload = [];

    rows.forEach(row => {
        const id = row.getAttribute('data-id');
        const inputs = row.querySelectorAll('input[data-field]');
        const rowData = { id: id };

        inputs.forEach(input => {
            const field = input.getAttribute('data-field');
            const rawVal = input.value.trim();
            rowData[field] = rawVal !== '' ? rawVal : null;
        });

        payload.push(rowData);
    });

    try {
        const { data, error } = await supabaseClient.rpc('update_users_for_data_center', {
            p_user_id: currentUserId,
            p_payload: payload
        });

        if (error) {
            alert("حدث خطأ أثناء الحفظ: " + error.message);
            return;
        }

        if (data && data.success) {
            alert(data.message || "تم حفظ التعديلات بنجاح!");
            await loadUsersDataIntoSheetGrid();
        } else {
            alert(data?.message || "فشل حفظ التعديلات");
        }
    } catch (err) {
        console.error("Save users sheet error:", err);
        alert("حدث خطأ غير متوقع أثناء الحفظ");
    }
}

// ================= جداول الموديلات في مركز البيانات =================
// المفتاح (key) هو الجزء الذي يتوسط اسم الدالة: get_<key>_models_for_data_center
const DATA_CENTER_BRANDS = [
    { key: 'apple',   label: 'أبل - Apple' },
    { key: 'samsung', label: 'سامسونج - Samsung' },
    { key: 'xiaomi',  label: 'شاومي - Xiaomi' },
    { key: 'redmi',   label: 'ريدمي - Redmi' },
    { key: 'infinix', label: 'انفينكس - Infinix' },
    { key: 'oppo',    label: 'أوبو - Oppo' },
    { key: 'realme',  label: 'ريلمي - Realme' },
    { key: 'huawei',  label: 'هواوي - Huawei' },
    { key: 'vivo',    label: 'فيفو - Vivo' },
    { key: 'honor',   label: 'هونر - Honor' },
    { key: 'htc',     label: 'إتش تي سي - HTC' },
    { key: 'nokia',   label: 'نوكيا - Nokia' },
    { key: 'techno',  label: 'تكنو - Techno' },
    { key: 'itel',    label: 'أيتل - Itel' }
];

let currentModelsSheetData = [];
let currentModelsSheetBrand = '';

function escapeHtmlValue(val) {
    return String(val === null || val === undefined ? '' : val)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ---------- شاشة اختيار الماركة ----------
function renderDataCenterBrandsScreen() {
    closeSidebar();

    const container = document.getElementById('appContainer');
    container.innerHTML = `
        ${getHeaderTemplate()}
        <div class="flex items-center justify-between mb-4 flex-shrink-0 flex-wrap gap-2">
            <button type="button" onclick="renderDataCenterScreen()" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer">
                <svg class="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                <span>رجوع لمركز البيانات</span>
            </button>
            <h2 class="text-sm sm:text-base font-bold text-gray-800">جداول الموديلات - اختر الماركة</h2>
        </div>

        <div class="flex-1 overflow-y-auto space-y-3 p-1">
            ${DATA_CENTER_BRANDS.map((brand, index) => {
                const style = getRotatingCardStyle(index);
                return `
                    <div onclick="renderDataCenterModelsSheet('${brand.key}', '${brand.label}')" class="w-full ${style.bg} border ${style.border} p-4 rounded-2xl shadow-sm flex items-center justify-between cursor-pointer transition-all text-sm sm:text-base group">
                        <span class="font-bold text-gray-800" dir="auto">${brand.label}</span>
                        <svg class="w-5 h-5 ${style.icon} flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    loadDynamicMenuIntoSidebar();
}

// ---------- شاشة جدول موديلات ماركة معينة (شيت قابل للتعديل) ----------
// ملاحظة: نستخدم نفس id الخاص بشيت المستخدمين (editableUsersTable) للاستفادة
// من نفس التنسيق وميزات اللصق الجماعي والسحب للتعبئة بدون تكرار الكود.
async function renderDataCenterModelsSheet(brandKey, brandLabel) {
    closeSidebar();
    currentModelsSheetBrand = brandKey;

    const container = document.getElementById('appContainer');
    container.innerHTML = `
        ${getHeaderTemplate()}
        <div class="flex items-center justify-between mb-3 flex-shrink-0 flex-wrap gap-2">
            <div class="flex items-center gap-2 flex-wrap">
                <button type="button" onclick="renderDataCenterBrandsScreen()" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer">
                    <svg class="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                    <span>رجوع للماركات</span>
                </button>
                <button type="button" onclick="renderDataCenterModelsSheet('${brandKey}', '${brandLabel}')" class="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 border border-blue-200 cursor-pointer">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    <span>تحديث</span>
                </button>
                <button type="button" onclick="saveModelsSheetToDB()" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                    <span>حفظ التعديلات لقاعدة البيانات</span>
                </button>
                <button type="button" onclick="exportModelsSheetToExcel()" class="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    <span>تصدير إلى إكسل</span>
                </button>
            </div>
            <h2 id="modelsSheetTitle" class="text-sm sm:text-base font-bold text-gray-800">جدول موديلات ${brandLabel}</h2>
        </div>

        <div id="modelsSheetContainer" class="flex-1 overflow-y-auto p-1 border border-slate-300 rounded-xl bg-white shadow-inner">
            <div class="text-center text-gray-400 text-sm py-8">جاري جلب الموديلات...</div>
        </div>
    `;

    loadDynamicMenuIntoSidebar();

    const sheetContainer = document.getElementById('modelsSheetContainer');
    const titleElement = document.getElementById('modelsSheetTitle');

    try {
        const { data, error } = await supabaseClient.rpc(`get_${brandKey}_models_for_data_center`, {
            p_user_id: currentUserId
        });

        if (error) {
            sheetContainer.innerHTML = `<div class="text-center text-red-400 text-sm py-8">خطأ في جلب البيانات: ${escapeHtmlValue(error.message)}</div>`;
            return;
        }

        let modelsList = [];
        if (Array.isArray(data)) {
            modelsList = data;
        } else if (typeof data === 'string') {
            try { modelsList = JSON.parse(data); } catch(e){}
        }

        currentModelsSheetData = modelsList;

        if (titleElement) {
            titleElement.innerText = `جدول موديلات ${brandLabel} (${modelsList.length})`;
        }

        if (modelsList.length === 0) {
            const raw = escapeHtmlValue(JSON.stringify(data)).slice(0, 120);
            sheetContainer.innerHTML = `
                <div class="text-center text-gray-500 py-12 px-4 space-y-2">
                    <p class="font-semibold">الدالة رجعت قائمة فارغة لهذا الجدول</p>
                    <p class="text-xs text-gray-400" dir="ltr">${raw}</p>
                </div>`;
            return;
        }

        const columns = Object.keys(modelsList[0]);
        const readOnlyCols = ['id', 'created_at', 'updated_at'];

        sheetContainer.innerHTML = `
            <table id="editableUsersTable">
                <thead>
                    <tr>
                        ${columns.map(col => `<th>${escapeHtmlValue(col)}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${modelsList.map(row => `
                        <tr data-id="${escapeHtmlValue(row.id)}">
                            ${columns.map(col => {
                                const val = row[col] !== null && row[col] !== undefined ? row[col] : '';
                                if (readOnlyCols.includes(col)) {
                                    return `<td class="p-2 font-mono text-slate-500 text-xs whitespace-nowrap min-w-[150px]" dir="ltr">${escapeHtmlValue(val)}</td>`;
                                }
                                return `
                                    <td class="min-w-[160px] h-[38px] relative">
                                        <input type="text" data-field="${escapeHtmlValue(col)}" value="${escapeHtmlValue(val)}" class="excel-input" dir="auto">
                                        <div class="drag-handle" title="اسحب للتعبئة التلقائية"></div>
                                    </td>
                                `;
                            }).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        enableExcelPasteAndDragFill();
    } catch (err) {
        console.error("Models sheet error:", err);
        sheetContainer.innerHTML = `<div class="text-center text-red-400 text-sm py-8">حدث خطأ غير متوقع</div>`;
    }
}

// ---------- حفظ شيت الموديلات في قاعدة البيانات ----------
async function saveModelsSheetToDB() {
    const table = document.getElementById('editableUsersTable');
    if (!table) return;

    const payload = [];
    table.querySelectorAll('tbody tr').forEach(row => {
        const rowData = { id: row.getAttribute('data-id') };
        row.querySelectorAll('input[data-field]').forEach(input => {
            const rawVal = input.value.trim();
            rowData[input.getAttribute('data-field')] = rawVal !== '' ? rawVal : null;
        });
        payload.push(rowData);
    });

    try {
        // دالة الحفظ الخاصة بكل ماركة: update_<brand>_models_for_data_center
        const { data, error } = await supabaseClient.rpc(`update_${currentModelsSheetBrand}_models_for_data_center`, {
            p_user_id: currentUserId,
            p_payload: payload
        });

        if (error) {
            alert("حدث خطأ أثناء الحفظ: " + error.message);
            return;
        }

        if (data && data.success) {
            alert(data.message || "تم حفظ التعديلات بنجاح!");
        } else {
            alert(data?.message || "فشل حفظ التعديلات");
        }
    } catch (err) {
        console.error("Save models sheet error:", err);
        alert("حدث خطأ غير متوقع أثناء الحفظ");
    }
}

// ---------- تصدير شيت الموديلات (بالقيم الحالية بعد التعديل) إلى XLSX ----------
function exportModelsSheetToExcel() {
    const table = document.getElementById('editableUsersTable');
    if (!table) {
        alert("لا توجد بيانات للتصدير حالياً");
        return;
    }

    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.innerText.trim());
    const rowsData = [];
    table.querySelectorAll('tbody tr').forEach(row => {
        rowsData.push(Array.from(row.querySelectorAll('td')).map(td => {
            const input = td.querySelector('input.excel-input');
            return input ? input.value : td.innerText.trim();
        }));
    });

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rowsData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, currentModelsSheetBrand || 'models');

    const fileName = `${currentModelsSheetBrand}_models_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
}
