// =====================================================================
// js/features/dashboard/dashboard.js — الرحلات الرئيسية: شراء قطع الغيار / تنبيهات الصيانة / التوافقات
// =====================================================================

// مسار الرحلة الحالية: 'buy' (شراء قطع الغيار) أو 'alerts' (تنبيهات الصيانة)
let currentFlow = 'buy'; // 'buy' | 'alerts' | 'compat'

// بداية رحلة تنبيهات الصيانة: الماركات ← الموديلات ← قطع الغيار ← التنبيه
function startMaintenanceAlertsFlow() {
    currentFlow = 'alerts';
    selectedPart = '';
    renderBrandsScreen('تنبيهات الصيانة');
}

// بداية رحلة التوافقات: الماركات ← الموديلات ← قطع الغيار ← التوافقات
function startCompatFlow() {
    currentFlow = 'compat';
    selectedPart = '';
    renderBrandsScreen('التوافقات');
}

// ================= الشاشة الرئيسية =================
async function renderMainDashboard() {
    currentFlow = 'buy';
    const html = `
        ${getHeaderTemplate()}
        <div class="flex-1 overflow-y-auto space-y-4 px-1">
            <div class="mb-4">
                <img src="https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80" alt="Banner" class="w-full h-36 sm:h-48 object-cover rounded-2xl shadow-md">
            </div>
            <div id="partitionsContainer" class="space-y-3.5 pb-4">
                <div class="text-center text-gray-400 text-sm py-4">جاري تحميل الأقسام...</div>
            </div>
        </div>
    `;
    document.getElementById('appContainer').innerHTML = html;
    loadDynamicMenuIntoSidebar();

    try {
        const { data, error } = await supabaseClient.rpc('get_partitions');

        if (error) {
            showSystemAlert("فشل جلب الأقسام", currentUserId || "غير معروف", "قاعدة البيانات", error.message);
            document.getElementById('partitionsContainer').innerHTML = `<div class="text-center text-red-400 text-sm py-4">تعذر تحميل الأقسام</div>`;
            return;
        }

        let partitionsList = [];
        if (Array.isArray(data)) {
            partitionsList = data;
        } else if (typeof data === 'string') {
            try { partitionsList = JSON.parse(data); } catch(e){}
        }

        const container = document.getElementById('partitionsContainer');
        if (container && partitionsList && partitionsList.length > 0) {
            let partitionsHtml = partitionsList.map(name => {
                let clickAction = "";
                if (name.includes('تنبيهات الصيانة')) {
                    clickAction = "startMaintenanceAlertsFlow()";
                } else if (name.includes('التوافقات')) {
                    clickAction = "startCompatFlow()";
                } else if (name.includes('شراء قطع الغيار')) {
                    clickAction = "renderBrandsScreen()";
                } else if (name.includes('قطع الغيار')) {
                    clickAction = "UI.toast('قسم قطع الغيار سيتوفر قريباً')";   // renderPartsScreen مكانتش معرّفة في أي ملف
                } else if (name.includes('الماركات')) {
                    clickAction = "renderBrandsScreen()";
                } else if (name.includes('الموديلات')) {
                    clickAction = "renderModelsScreen('Samsung')";
                } else {
                    clickAction = `alert(${jsArg('قسم ' + name)})`;
                }

                return `
                    <div onclick="${clickAction}" class="w-full bg-blue-600 hover:bg-blue-700 text-white p-5 sm:p-6 rounded-2xl shadow-md cursor-pointer transition-all flex items-center justify-between">
                        <span class="font-bold text-lg sm:text-xl" dir="auto">${escapeHtmlValue(name)}</span>
                        <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                    </div>
                `;
            }).join('');

            container.innerHTML = partitionsHtml;
        } else {
            container.innerHTML = `<div class="text-center text-gray-400 text-sm py-4">لا توجد أقسام متاحة</div>`;
        }
    } catch (err) {
        showSystemAlert("استثناء غير متوقع", currentUserId || "غير معروف", "تنفيذ JavaScript", err.message);
    }
}

// ================= شاشة الماركات =================
async function renderBrandsScreen(partName = '') {
    if (partName) selectedPart = partName;

    document.getElementById('appContainer').innerHTML = `
        ${getHeaderTemplate(true)}
        <div class="flex items-center justify-between mb-4 flex-shrink-0">
            <button onclick="renderMainDashboard()" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer">
                <svg class="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                <span>رجوع</span>
            </button>
            <h2 class="text-sm sm:text-base font-bold text-gray-800">اختر الماركة (${escapeHtmlValue(selectedPart || 'شراء قطع الغيار')})</h2>
        </div>
        <div id="brandsListContainer" class="flex-1 overflow-y-auto space-y-3 p-1">
            <div class="text-center text-gray-400 text-sm py-8">جاري جلب الماركات...</div>
        </div>
    `;

    loadDynamicMenuIntoSidebar();

    let brands = [];
    try {
        const { data, error } = await supabaseClient.rpc('get_brands');

        if (error) {
            showSystemAlert("فشل جلب الماركات", currentUserId || "غير معروف", "دالة get_brands", error.message);
        } else if (data) {
            brands = data;
        }
    } catch (err) {
        showSystemAlert("استثناء في جلب الماركات", currentUserId || "غير معروف", "تنفيذ RPC", err.message);
    }

    const container = document.getElementById('brandsListContainer');
    if (!container) return;

    if (brands.length > 0) {
        container.innerHTML = brands.map((brand, index) => {
            const style = getRotatingCardStyle(index);
            return `
                <div onclick="renderModelsScreen(${jsArg(brand)})" class="w-full ${style.bg} border ${style.border} p-4 rounded-2xl shadow-sm flex items-center justify-between cursor-pointer transition-all text-sm sm:text-base group">
                    <span class="font-bold text-gray-800" dir="auto">${escapeHtmlValue(brand)}</span>
                    <svg class="w-5 h-5 ${style.icon} flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                </div>
            `;
        }).join('');
    } else {
        container.innerHTML = `<div class="text-center text-gray-500 py-6">لا توجد ماركات متاحة حالياً</div>`;
    }
}

// ================= شاشة الموديلات =================
async function renderModelsScreen(brand) {
    selectedBrand = brand;

    // الموديلات بتتجاب من الدالة العامة get_models (زي get_brands)
    const brandSlug = (typeof sdcBrandSlug === 'function') ? sdcBrandSlug(brand) : '';
    let models = [];
    let modelsError = '';

    if (!brandSlug) {
        modelsError = 'الماركة غير معروفة: ' + brand;
    } else {
        try {
            const { data, error } = await supabaseClient.rpc('get_models', {
                p_brand: brandSlug
            });
            if (error) {
                modelsError = error.message;
            } else {
                let rows = data;
                if (typeof rows === 'string') { try { rows = JSON.parse(rows); } catch (e) {} }
                models = (Array.isArray(rows) ? rows : []).map(r => ({
                    device_name: r.model_name,
                    model_code: r.model_code,
                    screen_compatibility: null,
                    battery_model: r.battery_code
                }));
            }
        } catch (err) {
            modelsError = err.message;
        }
    }

    let modelsHtml = "";
    if (models.length > 0) {
        modelsHtml = models.map((m, index) => {
            const style = getRotatingCardStyle(index);
            const escapedCompat = m.screen_compatibility ? encodeURIComponent(m.screen_compatibility) : '';
            const escapedBattery = m.battery_model ? encodeURIComponent(m.battery_model) : '';
            const escapedCode = m.model_code ? encodeURIComponent(m.model_code) : '';
            return `
                <div onclick="renderPartsScreenAfterModel(${jsArg(m.device_name)}, ${jsArg(escapedCode)}, ${jsArg(escapedCompat)}, ${jsArg(escapedBattery)})" class="w-full ${style.bg} border ${style.border} p-4 rounded-2xl shadow-sm flex items-center justify-between cursor-pointer transition-all text-sm sm:text-base group">
                    <div class="text-right">
                        <span class="font-bold text-gray-800 block" dir="auto">${escapeHtmlValue(m.device_name)}</span>
                        ${m.model_code ? `<span class="text-xs text-gray-500 block mt-0.5" dir="auto">الكود: ${escapeHtmlValue(m.model_code)}</span>` : ''}
                    </div>
                    <svg class="w-5 h-5 ${style.icon} flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                </div>
            `;
        }).join('');
    } else {
        modelsHtml = `<div class="text-center text-gray-500 py-6">لا توجد موديلات متاحة${modelsError ? `<div class="text-red-400 text-xs mt-2" dir="ltr">${escapeHtmlValue(modelsError)}</div>` : ''}</div>`;
    }

    const html = `
        ${getHeaderTemplate(true)}
        <div class="flex items-center justify-between mb-4 flex-shrink-0">
            <button onclick="renderBrandsScreen()" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer">
                <svg class="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                <span>رجوع</span>
            </button>
            <h2 class="text-sm sm:text-base font-bold text-gray-800">اختر موديل (${escapeHtmlValue(brand)})</h2>
        </div>
        <div class="flex-1 overflow-y-auto space-y-3 p-1">
            ${modelsHtml}
        </div>
    `;
    document.getElementById('appContainer').innerHTML = html;
    loadDynamicMenuIntoSidebar();
}

// ================= شاشة قطع الغيار بعد اختيار الموديل =================
async function renderPartsScreenAfterModel(modelName = '', modelCode = '', screenCompat = '', batteryModel = '') {
    selectedModel = modelName;
    selectedModelCode = modelCode ? decodeURIComponent(modelCode) : '';
    currentScreenCompatibility = screenCompat ? decodeURIComponent(screenCompat) : '';
    currentBatteryModel = batteryModel ? decodeURIComponent(batteryModel) : '';

    document.getElementById('appContainer').innerHTML = `
        ${getHeaderTemplate(true)}
        <div class="flex items-center justify-between mb-4 flex-shrink-0">
            <button onclick="renderModelsScreen(${jsArg(selectedBrand)})" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer">
                <svg class="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                <span>رجوع</span>
            </button>
            <h2 class="text-sm sm:text-base font-bold text-gray-800">اختر قطعة الغيار (${escapeHtmlValue(selectedModel)})</h2>
        </div>
        <div id="partsListContainerAfter" class="flex-1 overflow-y-auto space-y-3 p-1">
            <div class="text-center text-gray-400 text-sm py-8">جاري جلب قطع الغيار...</div>
        </div>
    `;

    loadDynamicMenuIntoSidebar();

    let sparePartsList = [];
    try {
        const { data, error } = await supabaseClient.rpc('get_spare_parts');

        if (error) {
            showSystemAlert("فشل جلب قطع الغيار", currentUserId || "غير معروف", "دالة get_spare_parts", error.message);
        } else if (data) {
            sparePartsList = data;
        }
    } catch (err) {
        showSystemAlert("استثناء في جلب قطع الغيار", currentUserId || "غير معروف", "تنفيذ RPC", err.message);
    }

    const container = document.getElementById('partsListContainerAfter');
    if (!container) return;

    if (sparePartsList.length > 0) {
        container.innerHTML = sparePartsList.map((part, index) => {
            const style = getRotatingCardStyle(index);
            return `
                <div onclick="renderPartDetailsFinal(${jsArg(part)})" class="w-full ${style.bg} border ${style.border} p-4 rounded-2xl shadow-sm flex items-center justify-between cursor-pointer transition-all text-sm sm:text-base group">
                    <span class="font-bold text-gray-800 text-right flex-1 ml-3" dir="auto">${escapeHtmlValue(part)}</span>
                    <svg class="w-5 h-5 ${style.icon} flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                </div>
            `;
        }).join('');
    } else {
        container.innerHTML = `<div class="text-center text-gray-500 py-6">لا توجد قطع غيار متاحة حالياً</div>`;
    }
}

async function renderPartDetailsFinal(partName = '') {
    selectedPart = partName;
    if (currentFlow === 'alerts' || currentFlow === 'compat') {
        renderModelPartResultScreen(currentFlow, partName);
        return;
    }
    renderBuyPartScreen(partName);
}


// ================= الشاشة النهائية: تنبيهات / توافقات (الموديل + قطعة الغيار) =================
// التنبيهات: بتجيب جدول الماركة من مركز البيانات، وتدوّر على صف الموديل (تطابق تام على الاسم).
// التوافقات: بتجيب صف الموديل مباشرة من الدالة get_compatibility.
function mprNorm(v) {
    return String(v ?? '').toLowerCase().replace(/\s+/g, '');
}

const MPR_CONFIG = {
    alerts: {
        title: 'تنبيهات الصيانة',
        splitRe: /\r\n|\n|\r/,
        empty: 'لا توجد تنبيهات صيانة لهذه القطعة'
    },
    compat: {
        title: 'التوافقات',
        splitRe: /\r\n|\n|\r|,|،/,
        empty: 'لا توجد توافقات لهذه القطعة'
    }
};

function mprItems(raw, splitRe) {
    return String(raw ?? '').split(splitRe).map(x => x.trim()).filter(Boolean);
}

function mprAlertItemHtml(text) {
    return `
        <div class="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-3.5">
            <svg class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            <div class="text-sm text-gray-800 leading-relaxed flex-1" dir="auto">${escapeHtmlValue(text)}</div>
        </div>`;
}

function mprChipHtml(text) {
    return `<span class="inline-flex items-center bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-full text-sm font-semibold" dir="auto">${escapeHtmlValue(text)}</span>`;
}

function mprSectionHtml(title, items, kind, emptyText) {
    const body = items.length
        ? (kind === 'alerts'
            ? `<div class="space-y-2">${items.map(mprAlertItemHtml).join('')}</div>`
            : `<div class="flex flex-wrap gap-2">${items.map(mprChipHtml).join('')}</div>`)
        : `<div class="text-sm text-gray-400 text-center py-2">${escapeHtmlValue(emptyText)}</div>`;
    return `
        <div class="w-full bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
            <div class="flex items-center justify-between mb-3">
                <div class="font-bold text-gray-800 text-sm sm:text-base">${escapeHtmlValue(title)}</div>
                <span class="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-0.5">${items.length}</span>
            </div>
            ${body}
        </div>`;
}

function mprBackAction() {
    return `renderPartsScreenAfterModel(${jsArg(selectedModel)}, ${jsArg(encodeURIComponent(selectedModelCode || ''))}, ${jsArg(encodeURIComponent(currentScreenCompatibility || ''))}, ${jsArg(encodeURIComponent(currentBatteryModel || ''))})`;
}

function mprShellHtml(title) {
    return `
        ${getHeaderTemplate(true)}
        <div class="flex items-center justify-between mb-4 flex-shrink-0">
            <button onclick="${mprBackAction()}" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer">
                <svg class="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                <span>رجوع</span>
            </button>
            <h2 class="text-sm sm:text-base font-bold text-gray-800">${escapeHtmlValue(title)}</h2>
        </div>
        <div id="mprBox" class="flex-1 overflow-y-auto space-y-3 p-1">
            <div class="text-center text-gray-400 text-sm py-8">جاري التحميل...</div>
        </div>
    `;
}

function mprHeaderCardHtml(partName) {
    return `
        <div class="w-full bg-gray-50 border border-gray-200 rounded-2xl shadow-sm p-4 flex items-center justify-between gap-3">
            <div class="min-w-0">
                <div class="text-xs text-gray-500">الموديل</div>
                <div class="font-bold text-gray-800 truncate" dir="auto">${escapeHtmlValue(selectedModel)}</div>
            </div>
            <div class="text-left min-w-0">
                <div class="text-xs text-gray-500">قطعة الغيار</div>
                <div class="font-bold text-blue-700 truncate" dir="auto">${escapeHtmlValue(partName)}</div>
            </div>
        </div>`;
}

function mprErrorSectionHtml(title, msg) {
    return `
        <div class="w-full bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
            <div class="font-bold text-gray-800 text-sm sm:text-base mb-2">${escapeHtmlValue(title)}</div>
            <div class="text-xs text-red-600 text-center py-2" dir="auto">${escapeHtmlValue(msg)}</div>
        </div>`;
}

// بيرجّع أقسام HTML (قسم للتنبيهات/التوافقات، وقسم تاني لمجموعات التوافق لو موجود). بيرمي Error برسالة واضحة لو حصل خطأ.
async function mprBuildSections(kind, partName) {
    const cfg = MPR_CONFIG[kind];
    const slug = (typeof sdcBrandSlug === 'function') ? sdcBrandSlug(selectedBrand) : '';
    const partKey = (typeof sdcPartSuffix === 'function') ? sdcPartSuffix(partName) : '';
    if (!slug) throw new Error('الماركة غير معروفة: ' + selectedBrand);
    if (!partKey) throw new Error(`قطعة الغيار "${partName}" غير مربوطة بعمود في الجدول`);

    let row = null, mainCol, groupsCol;

    if (kind === 'compat') {
        // الدالة الجديدة: بترجّع صف الموديل بس (أو null)
        const { data, error } = await supabaseClient.rpc('get_compatibility', {
            p_brand: slug,
            p_model_name: selectedModel
        });
        if (error) throw new Error(error.message);

        row = data;
        if (typeof row === 'string') { try { row = JSON.parse(row); } catch (e) { row = null; } }

        mainCol = `${slug}_model_${partKey}_compatibility`;
        groupsCol = `${slug}_model_${partKey}_compatibility_selected_groups`;

        if (row && !(mainCol in row) && !(groupsCol in row)) {
            throw new Error(`لا يوجد عمود للقطعة "${partName}" في الجدول`);
        }
    } else {
        // الدالة الجديدة: بترجّع صف الموديل بس (أو null)
        const { data, error } = await supabaseClient.rpc('get_maintenance_alerts', {
            p_brand: slug,
            p_model_name: selectedModel
        });
        if (error) throw new Error(error.message);

        row = data;
        if (typeof row === 'string') { try { row = JSON.parse(row); } catch (e) { row = null; } }

        // أعمدة التنبيهات: {brand}_{part}_maintenance_alerts (من غير كلمة model)
        mainCol = `${slug}_${partKey}_maintenance_alerts`;
        groupsCol = null;

        if (row && !(mainCol in row)) {
            throw new Error(`لا يوجد عمود للقطعة "${partName}" في الجدول`);
        }
    }

    const sections = [];
    if (mainCol) {
        const items = row ? mprItems(row[mainCol], cfg.splitRe) : [];
        sections.push(mprSectionHtml(kind === 'alerts' ? `تنبيهات صيانة ${partName}` : `توافقات ${partName}`, items, kind, cfg.empty));
    }
    if (groupsCol) {
        const items = row ? mprItems(row[groupsCol], cfg.splitRe) : [];
        sections.push(mprSectionHtml(`مجموعات توافق ${partName}`, items, kind, cfg.empty));
    }
    return sections;
}

// ---------- الشاشة النهائية لرحلة التوافقات أو التنبيهات ----------
async function renderModelPartResultScreen(kind, partName = '') {
    document.getElementById('appContainer').innerHTML = mprShellHtml(MPR_CONFIG[kind].title);
    loadDynamicMenuIntoSidebar();
    const box = document.getElementById('mprBox');

    try {
        const sections = await mprBuildSections(kind, partName);
        box.innerHTML = mprHeaderCardHtml(partName) + sections.join('');
    } catch (err) {
        console.error('Model part result error:', err);
        box.innerHTML = mprHeaderCardHtml(partName) + mprErrorSectionHtml(MPR_CONFIG[kind].title, err.message);
    }
}

// ---------- الشاشة النهائية لرحلة شراء قطع الغيار ----------
// الترتيب: كود البطارية (لو القطعة بطارية) ← الشراء (التجار وأسعارهم) ← التوافقات ← التنبيهات
function mprBatteryCodeHtml() {
    return `
        <div class="w-full bg-blue-50 border border-blue-200 rounded-2xl shadow-sm p-4 flex items-center justify-between gap-3">
            <div class="font-bold text-gray-800 text-sm sm:text-base">كود البطارية</div>
            <div class="font-mono font-bold text-blue-700 text-base" dir="ltr">${currentBatteryModel ? escapeHtmlValue(currentBatteryModel) : '—'}</div>
        </div>`;
}

// ---------- قسم الشراء: كارت لكل تاجر وأسعاره (من دالة get_spare_part_prices_for_buyers) ----------
// بيحوّل أعمدة الأسعار (سعر <النوع> "جملة" / "قطاعى") لجدول صغير: النوع | جملة | قطاعى
function mprPriceTableHtml(prices) {
    const types = [];
    const map = {};
    let hasWholesale = false;
    (prices || []).forEach(p => {
        const m = String(p.label).match(/^\s*سعر\s*(.*?)\s*"(جملة|قطاعى)"\s*$/);
        const type = m ? m[1].trim() : String(p.label);
        const kind = m ? m[2] : 'سعر';
        if (kind === 'جملة') hasWholesale = true;
        if (!(type in map)) { map[type] = {}; types.push(type); }
        map[type][kind] = p.value;
    });
    const fmt = v => (v === undefined || v === null) ? '—' : Number(v).toLocaleString('en-US');
    // الفنى بيشوف القطاعى بس (السيرفر مش بيبعت أسعار الجملة له)، فبنخفى عمود الجملة
    const gridCols = hasWholesale ? 'grid-cols-[1.5fr_1fr_1fr]' : 'grid-cols-[1.5fr_1fr]';
    const priceCell = (v, extra = '') => `<div class="${extra} text-center font-mono font-bold text-gray-800" dir="ltr">${escapeHtmlValue(fmt(v))}</div>`;

    const rows = types.map(type => {
        const r = map[type];
        let cells;
        if (r['سعر'] !== undefined) {
            cells = priceCell(r['سعر'], hasWholesale ? 'col-span-2' : '');
        } else {
            cells = (hasWholesale ? priceCell(r['جملة']) : '') + priceCell(r['قطاعى']);
        }
        return `
            <div class="grid ${gridCols} gap-2 items-center py-2 border-b border-gray-100 last:border-0 text-sm">
                <div class="font-semibold text-gray-800" dir="auto">${escapeHtmlValue(type || 'السعر')}</div>
                ${cells}
            </div>`;
    }).join('');

    return `
        <div class="grid ${gridCols} gap-2 text-xs font-bold text-gray-500 pb-1 border-b border-gray-200">
            <div>النوع</div>${hasWholesale ? '<div class="text-center">جملة</div>' : ''}<div class="text-center">قطاعى</div>
        </div>
        ${rows}`;
}

function mprSellerCardHtml(seller, groupBased) {
    const items = (seller.items || []).map(it => `
        <div class="mt-3 first:mt-0">
            ${groupBased && it.key ? `<div class="mb-2">${mprChipHtml(it.key)}</div>` : ''}
            ${mprPriceTableHtml(it.prices)}
        </div>`).join('');
    return `
        <div class="w-full bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
            <div class="flex items-center gap-2 mb-3">
                <svg class="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M5 10v10h14V10M4 10l1-6h14l1 6"></path></svg>
                <div class="font-bold text-gray-800 text-sm sm:text-base" dir="auto">${escapeHtmlValue(seller.seller_name)}</div>
            </div>
            ${items}
        </div>`;
}

async function mprBuildPurchaseSection(partName) {
    const slug = (typeof sdcBrandSlug === 'function') ? sdcBrandSlug(selectedBrand) : '';
    const partKey = (typeof sdcPartSuffix === 'function') ? sdcPartSuffix(partName) : '';
    if (!slug) throw new Error('الماركة غير معروفة: ' + selectedBrand);
    if (!partKey) throw new Error(`قطعة الغيار "${partName}" غير مربوطة بجدول أسعار`);

    const { data, error } = await supabaseClient.rpc('get_spare_part_prices_for_buyers', {
        p_brand: slug,
        p_part: partKey,
        p_model_name: selectedModel,
        p_user_id: currentUserId
    });
    if (error) throw new Error(error.message);

    let payload = data;
    if (typeof payload === 'string') { try { payload = JSON.parse(payload); } catch (e) {} }
    const sellers = payload && Array.isArray(payload.sellers) ? payload.sellers : [];
    const groupBased = !!(payload && payload.group_based);

    const title = `
        <div class="flex items-center justify-between px-1">
            <div class="font-bold text-gray-800 text-sm sm:text-base">الشراء</div>
            <span class="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-0.5">${sellers.length}</span>
        </div>`;

    if (!sellers.length) {
        return [`
            <div class="w-full bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
                <div class="font-bold text-gray-800 text-sm sm:text-base mb-3">الشراء</div>
                <div class="text-sm text-gray-400 text-center py-2">لا يوجد تجار عارضين لهذه القطعة حالياً</div>
            </div>`];
    }
    return [title, ...sellers.map(sl => mprSellerCardHtml(sl, groupBased))];
}

async function renderBuyPartScreen(partName = '') {
    document.getElementById('appContainer').innerHTML = mprShellHtml('شراء قطعة غيار');
    loadDynamicMenuIntoSidebar();
    const box = document.getElementById('mprBox');

    const partKey = (typeof sdcPartSuffix === 'function') ? sdcPartSuffix(partName) : '';
    const [purchaseRes, compatRes, alertsRes] = await Promise.allSettled([
        mprBuildPurchaseSection(partName),
        mprBuildSections('compat', partName),
        mprBuildSections('alerts', partName)
    ]);

    const part = (res, title) => res.status === 'fulfilled'
        ? res.value.join('')
        : mprErrorSectionHtml(title, res.reason && res.reason.message ? res.reason.message : 'حدث خطأ');

    box.innerHTML = [
        mprHeaderCardHtml(partName),
        partKey === 'battery' ? mprBatteryCodeHtml() : '',
        part(purchaseRes, 'الشراء'),
        part(compatRes, `توافقات ${partName}`),
        part(alertsRes, `تنبيهات صيانة ${partName}`)
    ].join('');
}
