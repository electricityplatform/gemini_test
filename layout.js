// =====================================================================
// ui/layout.js — الهيدر العلوي والقائمة الجانبية
// =====================================================================

// showSearch: يظهر البحث (كتابة / صوت / كاميرا) فقط داخل رحلة "شراء قطع الغيار"
function getHeaderTemplate(showSearch = false) {
    return `
        <header class="app-header">
            <h1 class="app-title">Electricity</h1>
            <div class="app-header-row">
                ${UI.btn({ label: 'القائمة', icon: 'menu', kind: 'primary', action: 'toggleSidebar' })}
                ${UI.userChip()}
            </div>
            ${showSearch ? `
            <div class="search-row">
                <input type="text" placeholder="ابحث" class="input" aria-label="بحث">
                ${UI.btn({ icon: 'mic', kind: 'ghost', action: 'toast', args: ['جارِ الاستماع للصوت... فعّل ميكروفون المتصفح'], title: 'بحث صوتي' })}
                ${UI.btn({ icon: 'camera', kind: 'ghost', action: 'toast', args: ['جارِ فتح الكاميرا للمسح الضوئي...'], title: 'بحث بالكاميرا' })}
            </div>` : ''}
        </header>`;
}

// عنصر القائمة الجانبية -> الشاشة (الترتيب مهم: أول تطابق بيكسب)
const SIDEBAR_ROUTES = [
    ['البيانات الشخصية',        'profile'],
    ['بيانات المستخدمين',       'users'],        // كان بينادي renderUserProfilesScreen وهي مش موجودة
    ['مركز البيانات',           'dataCenter'],
    ['مركز العمليات',           'operations'],
    ['الإعدادات العامة',        'settings'],
    ['المنتجات المعروضة للبيع', 'myProducts']
];

async function loadDynamicMenuIntoSidebar() {
    const box = document.getElementById('sidebarContent');
    if (!box) return;
    box.innerHTML = UI.skeleton(4);

    const { data, error } = await Api.rpc('get_main_menu');
    if (!box.isConnected) return;
    if (error) { box.innerHTML = UI.state('تعذر تحميل القائمة', 'error'); return; }

    const items = Array.isArray(data) ? data : [];
    if (!items.length) { box.innerHTML = UI.state('لا توجد عناصر متاحة'); return; }

    box.innerHTML = items.map(item => {
        const text = String(item);
        const route = SIDEBAR_ROUTES.find(([needle]) => text.includes(needle));
        const card = route ? UI.listCard(text, 'go', [route[1]]) : UI.listCard(text, 'toast', [text]);
        return card.replace('class="list-card"', 'class="list-card is-compact"');
    }).join('');
}
