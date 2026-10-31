// =====================================================================
// core/state.js — حالة الجلسة الحالية (المستخدم + اختيارات الرحلة)
// =====================================================================
let currentUserId = null;
let currentUserRole = "";
let currentUserName = "";
let currentUserPhone = "";

let selectedBrand = "";
let selectedModel = "";
let selectedPart = "";
let selectedModelCode = "";
let currentScreenCompatibility = "";
let currentBatteryModel = "";
let heartbeatInterval = null;

function isDataCenterRowManager() {
    return DATA_CENTER_ROW_MANAGER_ROLES.includes(String(currentUserRole || '').trim());
}
