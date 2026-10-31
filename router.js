// =====================================================================
// core/router.js — خريطة الشاشات الرئيسية (مفتاح -> دالة)
// الدوال بتتنادى وقت الضغط، فمش مهم ترتيب تحميل ملفات الـfeatures.
// =====================================================================
const Screens = {
    login:        () => renderLoginScreen(),
    dashboard:    () => renderMainDashboard(),
    profile:      () => renderPersonalProfileScreen(),
    dataCenter:   () => renderDataCenterScreen(),
    operations:   () => renderOperationCenterScreen(),
    settings:     () => renderGeneralSettingsScreen(),
    myProducts:   () => renderMyProductsScreen(),
    users:        () => renderUsersDataCenterSheet()
};

Actions.register('go', (key) => {
    const fn = Screens[key];
    if (fn) fn(); else console.warn('شاشة غير معروفة:', key);
});
Actions.register('toggleSidebar', () => toggleSidebar());
