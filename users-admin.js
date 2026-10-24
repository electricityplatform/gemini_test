// ================= شاشة المستخدمين الجدد (آخر 24 ساعة) =================
async function renderNewUsersScreen() {
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
                <button type="button" onclick="fetchAndDisplayNewUsers();" class="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 border border-blue-200 cursor-pointer" title="تحديث البيانات">
                    <svg class="w-4 h-4 transform transition-transform hover:rotate-180 duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    <span>تحديث</span>
                </button>
            </div>
            <h2 id="newUsersTitle" class="text-sm sm:text-base font-bold text-gray-800 flex items-center gap-2">
                <span class="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>
                المستخدمون الجدد (آخر ٢٤ ساعة)
            </h2>
        </div>

        <div id="newUsersTableContainer" class="flex-1 overflow-y-auto p-1">
            <div class="text-center text-gray-400 text-sm py-8">جاري جلب المستخدمين الجدد...</div>
        </div>
    `;

    loadDynamicMenuIntoSidebar();
    await fetchAndDisplayNewUsers();
}

async function fetchAndDisplayNewUsers() {
    const tableContainer = document.getElementById('newUsersTableContainer');
    const titleElement = document.getElementById('newUsersTitle');

    if (tableContainer) {
        tableContainer.innerHTML = `<div class="text-center text-gray-400 text-sm py-8">جاري تحديث البيانات...</div>`;
    }

    try {
        const { data, error } = await supabaseClient.rpc('get_new_users_last_24h', {
            p_user_id: currentUserId
        });

        if (error) {
            if (tableContainer) tableContainer.innerHTML = `<div class="text-center text-red-400 text-sm py-8">خطأ في جلب البيانات: ${error.message}</div>`;
            return;
        }

        if (data && data.success === false) {
            if (tableContainer) tableContainer.innerHTML = `<div class="text-center text-red-500 text-sm py-8 font-semibold">${data.message || 'عفواً، لا تملك الصلاحية'}</div>`;
            return;
        }

        let newUsersList = [];
        if (Array.isArray(data)) {
            newUsersList = data;
        } else if (typeof data === 'string') {
            try { newUsersList = JSON.parse(data); } catch(e){}
        }

        if (titleElement) {
            titleElement.innerHTML = `
                <span class="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>
                المستخدمون الجدد (آخر ٢٤ ساعة) (${newUsersList.length})
            `;
        }

        if (newUsersList.length > 0) {
            if (tableContainer) {
                tableContainer.innerHTML = `
                    <div class="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
                        <table class="w-full text-right text-xs sm:text-sm whitespace-nowrap">
                            <thead class="bg-gray-50 text-gray-700 border-b border-gray-200">
                                <tr>
                                    <th class="p-3.5 font-bold whitespace-nowrap min-w-[130px]">تاريخ الإنشاء</th>
                                    <th class="p-3.5 font-bold">الرتبة</th>
                                    <th class="p-3.5 font-bold">الاسم</th>
                                    <th class="p-3.5 font-bold">اسم المتجر</th>
                                    <th class="p-3.5 font-bold">محافظة المتجر</th>
                                    <th class="p-3.5 font-bold">منطقة المتجر</th>
                                    <th class="p-3.5 font-bold">نطاق المتجر</th>
                                    <th class="p-3.5 font-bold">عنوان المتجر</th>
                                    <th class="p-3.5 font-bold">اسم المحل</th>
                                    <th class="p-3.5 font-bold">محافظة المحل</th>
                                    <th class="p-3.5 font-bold">منطقة المحل</th>
                                    <th class="p-3.5 font-bold">نطاق المحل</th>
                                    <th class="p-3.5 font-bold">عنوان المحل</th>
                                    <th class="p-3.5 font-bold">محافظة التوصيل</th>
                                    <th class="p-3.5 font-bold">منطقة التوصيل</th>
                                    <th class="p-3.5 font-bold">نطاق التوصيل</th>
                                    <th class="p-3.5 font-bold">رقم الهاتف</th>
                                    <th class="p-3.5 font-bold">رقم الواتساب</th>
                                    <th class="p-3.5 font-bold">البريد الإلكترونى</th>
                                    <th class="p-3.5 font-bold">رمز المرور</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100 bg-white">
                                ${newUsersList.map(user => {
                                    let rawTime = user.created_at || '';
                                    let datePart = '---';
                                    let timePart = '';

                                    if (rawTime && rawTime.includes('T')) {
                                        const parts = rawTime.split('T');
                                        datePart = parts[0];
                                        timePart = parts[1] ? parts[1].split('.')[0] : '';
                                    } else if (rawTime && rawTime.includes(' ')) {
                                        const parts = rawTime.split(' ');
                                        datePart = parts[0];
                                        timePart = parts[1] || '';
                                    } else {
                                        datePart = rawTime || '---';
                                    }

                                    return `
                                        <tr class="hover:bg-blue-50/50 transition-all">
                                            <td class="p-3.5 font-mono text-gray-700 leading-tight min-w-[130px]" dir="ltr">
                                                <div class="font-bold text-gray-800">${datePart}</div>${timePart ? `<div class="text-[11px] text-gray-500 mt-0.5">${timePart}</div>` : ''}
                                            </td>
                                            <td class="p-3.5 font-bold text-blue-600" dir="auto">${user.user_role || '---'}</td>
                                            <td class="p-3.5 font-semibold text-gray-800" dir="auto">${user.user_name || '---'}</td>
                                            <td class="p-3.5 text-gray-700" dir="auto">${user.store_name || '---'}</td>
                                            <td class="p-3.5 text-gray-700" dir="auto">${user.store_city || '---'}</td>
                                            <td class="p-3.5 text-gray-700" dir="auto">${user.store_region || '---'}</td>
                                            <td class="p-3.5 text-gray-700" dir="auto">${user.store_area || '---'}</td>
                                            <td class="p-3.5 text-gray-700" dir="auto">${user.store_address || '---'}</td>
                                            <td class="p-3.5 text-gray-700" dir="auto">${user.shop_name || '---'}</td>
                                            <td class="p-3.5 text-gray-700" dir="auto">${user.shop_city || '---'}</td>
                                            <td class="p-3.5 text-gray-700" dir="auto">${user.shop_region || '---'}</td>
                                            <td class="p-3.5 text-gray-700" dir="auto">${user.shop_area || '---'}</td>
                                            <td class="p-3.5 text-gray-700" dir="auto">${user.shop_address || '---'}</td>
                                            <td class="p-3.5 text-gray-700" dir="auto">${user.delivery_city || '---'}</td>
                                            <td class="p-3.5 text-gray-700" dir="auto">${user.delivery_region || '---'}</td>
                                            <td class="p-3.5 text-gray-700" dir="auto">${user.delivery_area || '---'}</td>
                                            <td class="p-3.5 font-mono text-gray-600" dir="ltr">${user.phone_number || '---'}</td>
                                            <td class="p-3.5 font-mono text-gray-600" dir="ltr">${user.whatsapp_number || '---'}</td>
                                            <td class="p-3.5 font-mono text-gray-600" dir="ltr">${user.gmail || '---'}</td>
                                            <td class="p-3.5 font-mono text-gray-600" dir="ltr">${user.password || '---'}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }
        } else {
            if (tableContainer) {
                tableContainer.innerHTML = `<div class="text-center text-gray-500 py-12 bg-gray-50 rounded-2xl border border-gray-200"><p class="font-semibold">لا توجد حسابات مسجلة في آخر ٢٤ ساعة</p></div>`;
            }
        }

    } catch (err) {
        console.error(err);
        if (tableContainer) tableContainer.innerHTML = `<div class="text-center text-red-400 text-sm py-8">حدث خطأ غير متوقع</div>`;
    }
}

// ================= شاشة بيانات المستخدمين (مع الفلترة) =================
async function renderUserProfilesScreen() {
    closeSidebar();

    const container = document.getElementById('appContainer');
    container.innerHTML = `
        ${getHeaderTemplate()}
        <div class="flex items-center justify-between mb-3 flex-shrink-0 flex-wrap gap-2">
            <div class="flex items-center gap-2">
                <button type="button" onclick="renderMainDashboard()" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer">
                    <svg class="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                    <span>رجوع</span>
                </button>
            </div>

            <div class="flex items-center gap-2">
                <button type="button" onclick="fetchAndDisplayUserProfiles();" class="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 border border-blue-200 cursor-pointer" title="تحديث البيانات">
                    <svg class="w-4 h-4 transform transition-transform hover:rotate-180 duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    <span>تحديث</span>
                </button>
                <button type="button" onclick="openFilterModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
                    <span>فلترة البيانات</span>
                </button>
                <button type="button" onclick="resetUserFilters()" id="resetFilterBtn" class="hidden bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer">
                    إلغاء الفلتر
                </button>
            </div>
        </div>

        <div id="activeFilterBadge" class="hidden bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-xl text-xs font-semibold mb-3 flex items-center justify-between flex-shrink-0">
            <span id="activeFilterText">---</span>
        </div>

        <h2 class="text-sm sm:text-base font-bold text-gray-800 mb-2">بيانات المستخدمين</h2>

        <div id="userProfilesTableContainer" class="flex-1 overflow-y-auto p-1">
            <div class="text-center text-gray-400 text-sm py-8">جاري جلب بيانات المستخدمين...</div>
        </div>

        <div id="filterModalOverlay" class="fixed inset-0 bg-black/50 z-50 hidden flex items-center justify-center p-4 transition-opacity opacity-0 duration-300">
            <div class="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 space-y-4 transform scale-95 transition-transform duration-300" id="filterModalContent">
                <div class="flex items-center justify-between border-b border-gray-100 pb-3">
                    <h3 class="font-bold text-gray-800 text-base" id="filterModalTitle">اختر نوع الفلترة</h3>
                    <button onclick="closeFilterModal()" class="text-gray-400 hover:text-red-500 p-1 rounded-xl">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <div id="filterModalBody" class="space-y-2"></div>
            </div>
        </div>
    `;

    loadDynamicMenuIntoSidebar();
    window.allUserProfilesCache = [];
    await fetchAndDisplayUserProfiles();
}

async function fetchAndDisplayUserProfiles() {
    const tableContainer = document.getElementById('userProfilesTableContainer');
    if (!tableContainer) return;

    tableContainer.innerHTML = `<div class="text-center text-gray-400 text-sm py-8">جاري تحديث البيانات...</div>`;

    try {
        const { data, error } = await supabaseClient.rpc('get_user_profiles', {
            p_user_id: currentUserId
        });

        if (error) {
            tableContainer.innerHTML = `<div class="text-center text-red-400 text-sm py-8">خطأ في جلب البيانات: ${error.message}</div>`;
            return;
        }

        let profilesList = [];
        if (Array.isArray(data)) {
            profilesList = data;
        } else if (typeof data === 'string') {
            try { profilesList = JSON.parse(data); } catch(e){}
        }

        window.allUserProfilesCache = profilesList;
        renderProfilesTableHTML(profilesList);

    } catch (err) {
        console.error(err);
        tableContainer.innerHTML = `<div class="text-center text-red-400 text-sm py-8">حدث خطأ غير متوقع</div>`;
    }
}

async function handleAutoUpdateUser(targetUserId) {
    const roleEl = document.getElementById(`role_${targetUserId}`);
    const storeAreaEl = document.getElementById(`store_area_${targetUserId}`);
    const shopAreaEl = document.getElementById(`shop_area_${targetUserId}`);
    const deliveryAreaEl = document.getElementById(`delivery_area_${targetUserId}`);

    try {
        const { data, error } = await supabaseClient.rpc('update_user_profiles', {
            p_user_id: currentUserId,
            p_target_user_id: targetUserId,
            p_user_role: roleEl ? roleEl.value : null,
            p_store_area: storeAreaEl ? storeAreaEl.value : null,
            p_shop_area: shopAreaEl ? shopAreaEl.value : null,
            p_delivery_area: deliveryAreaEl ? deliveryAreaEl.value : null
        });

        if (error) {
            alert("خطأ أثناء التحديث: " + error.message);
            return;
        }

        if (data && data.success) {
            alert(data.message || "تم تحديث البيانات بنجاح");
        } else {
            alert(data?.message || "تعذر تنفيذ التحديث");
        }
    } catch (err) {
        console.error("Auto update user error:", err);
        alert("حدث خطأ غير متوقع أثناء الحفظ");
    }
}

// ================= نافذة الفلترة =================
function openFilterModal() {
    const overlay = document.getElementById('filterModalOverlay');
    const content = document.getElementById('filterModalContent');
    if (!overlay || !content) return;

    overlay.classList.remove('hidden');
    setTimeout(() => {
        overlay.classList.remove('opacity-0');
        content.classList.remove('scale-95');
    }, 10);

    showMainFilterOptions();
}

function closeFilterModal() {
    const overlay = document.getElementById('filterModalOverlay');
    const content = document.getElementById('filterModalContent');
    if (!overlay || !content) return;

    overlay.classList.add('opacity-0');
    content.classList.add('scale-95');
    setTimeout(() => overlay.classList.add('hidden'), 300);
}

function showMainFilterOptions() {
    document.getElementById('filterModalTitle').innerText = 'اختر نوع الفلترة';
    document.getElementById('filterModalBody').innerHTML = `
        <button onclick="showDateFilterOptions()" class="w-full bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 p-3.5 rounded-2xl text-right font-semibold text-gray-800 transition-all flex items-center justify-between cursor-pointer">
            <span>فلترة بناءً على تاريخ الإنشاء</span>
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
        </button>
        <button onclick="showRoleFilterOptions()" class="w-full bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 p-3.5 rounded-2xl text-right font-semibold text-gray-800 transition-all flex items-center justify-between cursor-pointer">
            <span>فلترة بناءً على الرتبة</span>
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
        </button>
        <button onclick="showGovTypeOptions()" class="w-full bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 p-3.5 rounded-2xl text-right font-semibold text-gray-800 transition-all flex items-center justify-between cursor-pointer">
            <span>فلترة بناءً على المحافظة</span>
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
        </button>
    `;
}

function showDateFilterOptions() {
    document.getElementById('filterModalTitle').innerText = 'ترتيب حسب تاريخ الإنشاء';
    document.getElementById('filterModalBody').innerHTML = `
        <button onclick="showMainFilterOptions()" class="text-xs text-blue-600 font-semibold mb-2 flex items-center gap-1 cursor-pointer">
            <svg class="w-3.5 h-3.5 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
            <span>رجوع للخلف</span>
        </button>
        <div class="space-y-2">
            <button onclick="applyDateSortFilter('newest')" class="w-full bg-gray-50 hover:bg-blue-50 border border-gray-200 p-3.5 rounded-xl text-right font-semibold text-gray-800 transition-all cursor-pointer">
                من الأحدث للأقدم
            </button>
            <button onclick="applyDateSortFilter('oldest')" class="w-full bg-gray-50 hover:bg-blue-50 border border-gray-200 p-3.5 rounded-xl text-right font-semibold text-gray-800 transition-all cursor-pointer">
                من الأقدم للأحدث
            </button>
        </div>
    `;
}

function applyDateSortFilter(orderType) {
    closeFilterModal();
    if (!window.allUserProfilesCache) return;

    const sortedList = [...window.allUserProfilesCache].sort((a, b) => {
        const timeA = new Date(a.created_at || 0).getTime();
        const timeB = new Date(b.created_at || 0).getTime();

        if (orderType === 'newest') {
            return timeB - timeA;
        } else {
            return timeA - timeB;
        }
    });

    renderProfilesTableHTML(sortedList);
    const labelText = orderType === 'newest' ? 'تاريخ الإنشاء (من الأحدث للأقدم)' : 'تاريخ الإنشاء (من الأقدم للأحدث)';
    showActiveFilterBadge(`فلتر نشط: ${labelText}`);
}

function showRoleFilterOptions() {
    const roles = ['أدمن', 'مدير', 'مندوب', 'تاجر', 'فنى'];
    document.getElementById('filterModalTitle').innerText = 'اختر الرتبة المطلوبة';
    document.getElementById('filterModalBody').innerHTML = `
        <button onclick="showMainFilterOptions()" class="text-xs text-blue-600 font-semibold mb-2 flex items-center gap-1 cursor-pointer">
            <svg class="w-3.5 h-3.5 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
            <span>رجوع للخلف</span>
        </button>
        <div class="space-y-2 max-h-60 overflow-y-auto">
            ${roles.map(role => `
                <button onclick="applyRoleFilter('${role}')" class="w-full bg-gray-50 hover:bg-blue-50 border border-gray-200 p-3 rounded-xl text-right font-semibold text-gray-800 transition-all cursor-pointer">
                    ${role}
                </button>
            `).join('')}
        </div>
    `;
}

function showGovTypeOptions() {
    document.getElementById('filterModalTitle').innerText = 'اختر نوع المحافظة';
    document.getElementById('filterModalBody').innerHTML = `
        <button onclick="showMainFilterOptions()" class="text-xs text-blue-600 font-semibold mb-2 flex items-center gap-1 cursor-pointer">
            <svg class="w-3.5 h-3.5 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
            <span>رجوع للخلف</span>
        </button>
        <div class="space-y-2">
            <button onclick="showGovernoratesList('store_city', 'محافظة المتجر')" class="w-full bg-gray-50 hover:bg-blue-50 border border-gray-200 p-3.5 rounded-xl text-right font-semibold text-gray-800 transition-all cursor-pointer">
                محافظة المتجر
            </button>
            <button onclick="showGovernoratesList('shop_city', 'محافظة المحل')" class="w-full bg-gray-50 hover:bg-blue-50 border border-gray-200 p-3.5 rounded-xl text-right font-semibold text-gray-800 transition-all cursor-pointer">
                محافظة المحل
            </button>
            <button onclick="showGovernoratesList('delivery_city', 'محافظة التوصيل')" class="w-full bg-gray-50 hover:bg-blue-50 border border-gray-200 p-3.5 rounded-xl text-right font-semibold text-gray-800 transition-all cursor-pointer">
                محافظة التوصيل
            </button>
        </div>
    `;
}

function showGovernoratesList(cityColumnKey, labelName) {
    document.getElementById('filterModalTitle').innerText = `اختر ${labelName}`;
    document.getElementById('filterModalBody').innerHTML = `
        <button onclick="showGovTypeOptions()" class="text-xs text-blue-600 font-semibold mb-2 flex items-center gap-1 cursor-pointer">
            <svg class="w-3.5 h-3.5 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
            <span>رجوع لأنواع المحافظات</span>
        </button>
        <div class="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            ${EGYPTIAN_GOVERNORATES.map(gov => `
                <button onclick="applyGovFilter('${cityColumnKey}', '${gov}', '${labelName}')" class="w-full bg-gray-50 hover:bg-blue-50 border border-gray-200 p-2.5 rounded-xl text-right font-semibold text-gray-800 transition-all cursor-pointer text-xs sm:text-sm">
                    ${gov}
                </button>
            `).join('')}
        </div>
    `;
}

function applyRoleFilter(role) {
    closeFilterModal();
    const filtered = window.allUserProfilesCache.filter(user => user.user_role && user.user_role.trim() === role);
    renderProfilesTableHTML(filtered);
    showActiveFilterBadge(`فلتر نشط: الرتبة (${role})`);
}

function applyGovFilter(columnKey, govName, labelName) {
    closeFilterModal();
    const filtered = window.allUserProfilesCache.filter(user => user[columnKey] && user[columnKey].trim() === govName);
    renderProfilesTableHTML(filtered);
    showActiveFilterBadge(`فلتر نشط: ${labelName} (${govName})`);
}

function showActiveFilterBadge(text) {
    const badge = document.getElementById('activeFilterBadge');
    const badgeText = document.getElementById('activeFilterText');
    const resetBtn = document.getElementById('resetFilterBtn');

    if (badge && badgeText && resetBtn) {
        badgeText.innerText = text;
        badge.classList.remove('hidden');
        resetBtn.classList.remove('hidden');
    }
}

function resetUserFilters() {
    const badge = document.getElementById('activeFilterBadge');
    const resetBtn = document.getElementById('resetFilterBtn');

    if (badge) badge.classList.add('hidden');
    if (resetBtn) resetBtn.classList.add('hidden');

    if (window.allUserProfilesCache) {
        renderProfilesTableHTML(window.allUserProfilesCache);
    }
}

// ================= رسم جدول بيانات المستخدمين =================
function renderProfilesTableHTML(profilesList) {
    const tableContainer = document.getElementById('userProfilesTableContainer');
    if (!tableContainer) return;

    if (profilesList.length > 0) {
        tableContainer.innerHTML = `
            <div class="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
                <table class="w-full text-right text-xs sm:text-sm whitespace-nowrap">
                    <thead class="bg-gray-50 text-gray-700 border-b border-gray-200">
                        <tr>
                            <th class="p-3.5 font-bold whitespace-nowrap min-w-[130px]">تاريخ الإنشاء</th>
                            <th class="p-3.5 font-bold">الرتبة</th>
                            <th class="p-3.5 font-bold">الاسم</th>
                            <th class="p-3.5 font-bold">اسم المتجر</th>
                            <th class="p-3.5 font-bold">محافظة المتجر</th>
                            <th class="p-3.5 font-bold">منطقة المتجر</th>
                            <th class="p-3.5 font-bold">نطاق المتجر</th>
                            <th class="p-3.5 font-bold">عنوان المتجر</th>
                            <th class="p-3.5 font-bold">اسم المحل</th>
                            <th class="p-3.5 font-bold">محافظة المحل</th>
                            <th class="p-3.5 font-bold">منطقة المحل</th>
                            <th class="p-3.5 font-bold">نطاق المحل</th>
                            <th class="p-3.5 font-bold">عنوان المحل</th>
                            <th class="p-3.5 font-bold">محافظة التوصيل</th>
                            <th class="p-3.5 font-bold">منطقة التوصيل</th>
                            <th class="p-3.5 font-bold">نطاق التوصيل</th>
                            <th class="p-3.5 font-bold">رقم الهاتف</th>
                            <th class="p-3.5 font-bold">رقم الواتساب</th>
                            <th class="p-3.5 font-bold">البريد الإلكترونى</th>
                            <th class="p-3.5 font-bold">رمز المرور</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 bg-white">
                        ${profilesList.map(user => {
                            let rawTime = user.created_at || '';
                            let datePart = '---';
                            let timePart = '';

                            if (rawTime && rawTime.includes('T')) {
                                const parts = rawTime.split('T');
                                datePart = parts[0];
                                timePart = parts[1] ? parts[1].split('.')[0] : '';
                            } else if (rawTime && rawTime.includes(' ')) {
                                const parts = rawTime.split(' ');
                                datePart = parts[0];
                                timePart = parts[1] || '';
                            } else {
                                datePart = rawTime || '---';
                            }

                            const userId = user.id;

                            const storeAreas = getAreasListForRegion(user.store_region);
                            const shopAreas = getAreasListForRegion(user.shop_region);
                            const deliveryAreas = getAreasListForRegion(user.delivery_region);

                            return `
                                <tr class="hover:bg-blue-50/50 transition-all">
                                    <td class="p-3.5 font-mono text-gray-700 leading-tight min-w-[130px]" dir="ltr">
                                        <div class="font-bold text-gray-800">${datePart}</div>${timePart ? `<div class="text-[11px] text-gray-500 mt-0.5">${timePart}</div>` : ''}
                                    </td>
                                    <td class="p-3.5 font-bold text-blue-600" dir="auto">
                                        <select id="role_${userId}" onchange="handleAutoUpdateUser('${userId}')" class="bg-white border border-gray-300 rounded-lg p-1 text-xs font-semibold cursor-pointer">
                                            <option value="أدمن" ${user.user_role === 'أدمن' ? 'selected' : ''}>أدمن</option>
                                            <option value="مدير" ${user.user_role === 'مدير' ? 'selected' : ''}>مدير</option>
                                            <option value="مندوب" ${user.user_role === 'مندوب' ? 'selected' : ''}>مندوب</option>
                                            <option value="تاجر" ${user.user_role === 'تاجر' ? 'selected' : ''}>تاجر</option>
                                            <option value="فنى" ${user.user_role === 'فنى' ? 'selected' : ''}>فنى</option>
                                        </select>
                                    </td>
                                    <td class="p-3.5 font-semibold text-gray-800" dir="auto">${user.user_name || '---'}</td>
                                    <td class="p-3.5 text-gray-700" dir="auto">${user.store_name || '---'}</td>
                                    <td class="p-3.5 text-gray-700" dir="auto">${user.store_city || '---'}</td>
                                    <td class="p-3.5 text-gray-700" dir="auto">${user.store_region || '---'}</td>
                                    <td class="p-3.5 text-gray-700" dir="auto">
                                        <select id="store_area_${userId}" onchange="handleAutoUpdateUser('${userId}')" class="bg-white border border-gray-300 rounded-lg p-1 text-xs font-semibold cursor-pointer">
                                            <option value="">اختر النطاق...</option>
                                            ${storeAreas.map(a => `<option value="${a}" ${user.store_area === a ? 'selected' : ''}>${a}</option>`).join('')}
                                        </select>
                                    </td>
                                    <td class="p-3.5 text-gray-700" dir="auto">${user.store_address || '---'}</td>
                                    <td class="p-3.5 text-gray-700" dir="auto">${user.shop_name || '---'}</td>
                                    <td class="p-3.5 text-gray-700" dir="auto">${user.shop_city || '---'}</td>
                                    <td class="p-3.5 text-gray-700" dir="auto">${user.shop_region || '---'}</td>
                                    <td class="p-3.5 text-gray-700" dir="auto">
                                        <select id="shop_area_${userId}" onchange="handleAutoUpdateUser('${userId}')" class="bg-white border border-gray-300 rounded-lg p-1 text-xs font-semibold cursor-pointer">
                                            <option value="">اختر النطاق...</option>
                                            ${shopAreas.map(a => `<option value="${a}" ${user.shop_area === a ? 'selected' : ''}>${a}</option>`).join('')}
                                        </select>
                                    </td>
                                    <td class="p-3.5 text-gray-700" dir="auto">${user.shop_address || '---'}</td>
                                    <td class="p-3.5 text-gray-700" dir="auto">${user.delivery_city || '---'}</td>
                                    <td class="p-3.5 text-gray-700" dir="auto">${user.delivery_region || '---'}</td>
                                    <td class="p-3.5 text-gray-700" dir="auto">
                                        <select id="delivery_area_${userId}" onchange="handleAutoUpdateUser('${userId}')" class="bg-white border border-gray-300 rounded-lg p-1 text-xs font-semibold cursor-pointer">
                                            <option value="">اختر النطاق...</option>
                                            ${deliveryAreas.map(a => `<option value="${a}" ${user.delivery_area === a ? 'selected' : ''}>${a}</option>`).join('')}
                                        </select>
                                    </td>
                                    <td class="p-3.5 font-mono text-gray-600" dir="ltr">${user.phone_number || '---'}</td>
                                    <td class="p-3.5 font-mono text-gray-600" dir="ltr">${user.whatsapp_number || '---'}</td>
                                    <td class="p-3.5 font-mono text-gray-600" dir="ltr">${user.gmail || '---'}</td>
                                    <td class="p-3.5 font-mono text-gray-600" dir="ltr">${user.password || '---'}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } else {
        tableContainer.innerHTML = `<div class="text-center text-gray-500 py-12 bg-gray-50 rounded-2xl border border-gray-200">لا توجد بيانات مطابقة للفلتر</div>`;
    }
}
