// =====================================================================
// features/data-center/menu.js — شاشة مركز البيانات (قائمة الأقسام)
// =====================================================================

// اسم القسم (زي ما بيرجع من الداتابيز) -> الإجراء. الأقسام اللي مالهاش إجراء بتظهر برسالة "قريباً".
const DATA_CENTER_MENU_ACTIONS = {
    'المستخدمون':          { action: 'dc.run', args: ['renderUsersDataCenterSheet'] },
    'المستخدمون الجدد':    { action: 'dc.run', args: ['renderNewUsersScreen'] },
    'المستخدمون النشطون':  { action: 'dc.run', args: ['renderActiveUsersScreen'] },
    'سجل دخول المستخدمين': { action: 'dc.run', args: ['renderLoginHistoryScreen'] },
    'الأقسام':             { action: 'sheet.open', args: ['partitions'] },
    'الماركات':            { action: 'sheet.open', args: ['brands'] },
    'الموديلات':           { action: 'sheet.open', args: ['models'] },
    'قطع الغيار':          { action: 'sheet.open', args: ['spareParts'] },
    'التوافقات':           { action: 'sheet.open', args: ['compat'] },
    'مجموعات التوافقات':   { action: 'sheet.open', args: ['compatGroups'] },
    'تنبيهات الصيانة':     { action: 'sheet.open', args: ['alerts'] }
};

// الشاشات اللي لسه دوالها قديمة: بنناديها بالاسم وقت الضغط (whitelist من الجدول فوق بس)
const DATA_CENTER_LEGACY_SCREENS = {
    renderUsersDataCenterSheet: () => renderUsersDataCenterSheet(),
    renderNewUsersScreen:       () => renderNewUsersScreen(),
    renderActiveUsersScreen:    () => renderActiveUsersScreen(),
    renderLoginHistoryScreen:   () => renderLoginHistoryScreen()
};

Actions.register({
    'dc.home':    () => renderDataCenterScreen(),
    'dc.refresh': () => fetchAndDisplayDataCenterMenu(),
    'dc.run':     name => { const fn = DATA_CENTER_LEGACY_SCREENS[name]; if (fn) fn(); }
});

async function renderDataCenterScreen() {
    closeSidebar();
    document.getElementById('appContainer').innerHTML = `
        ${getHeaderTemplate()}
        <div class="toolbar">
            <div class="toolbar-group">
                ${UI.backButton('go', ['dashboard'], 'رجوع')}
                ${UI.btn({ label: 'تحديث', icon: 'refresh', kind: 'soft', action: 'dc.refresh' })}
            </div>
            <h2 class="screen-title">مركز البيانات</h2>
        </div>
        <div id="dataCenterContainer" class="list">${UI.skeleton(6)}</div>`;

    loadDynamicMenuIntoSidebar();
    await fetchAndDisplayDataCenterMenu();
}

async function fetchAndDisplayDataCenterMenu() {
    const box = document.getElementById('dataCenterContainer');
    if (!box) return;
    box.innerHTML = UI.skeleton(6);

    const { data, error } = await Api.rpc('get_data_center_menu');
    if (!box.isConnected) return;
    if (error) { box.innerHTML = UI.state('خطأ في جلب البيانات: ' + error, 'error'); return; }

    const items = Array.isArray(data) ? data : [];
    if (!items.length) {
        box.innerHTML = UI.state('لا توجد عناصر متاحة أو ليس لديك صلاحية الوصول');
        return;
    }

    box.innerHTML = items.map(item => {
        const text = String(item);
        const target = DATA_CENTER_MENU_ACTIONS[text];
        return target
            ? UI.listCard(text, target.action, target.args)
            : UI.listCard(text, 'toast', ['هذا القسم سيتوفر قريباً']);
    }).join('');
}
