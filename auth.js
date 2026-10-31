// ================= شاشة تسجيل الدخول (DaisyUI: card / tabs / input / btn / divider) =================
function renderLoginScreen() {
    const html = `
        <div class="flex-1 overflow-y-auto px-1">
            <div class="max-w-md mx-auto w-full py-2 sm:py-6">

                <div class="card bg-gradient-to-br from-primary to-blue-900 text-primary-content shadow-xl mb-6">
                    <div class="card-body gap-2">
                        <div class="text-secondary">${boltMarkSvg().replace('<svg', '<svg class="w-12 h-12"')}</div>
                        <h1 class="text-3xl font-bold tracking-tight">Electricity</h1>
                        <p class="text-sm opacity-80 leading-relaxed max-w-[32ch]">قارن أسعار قطع الغيار، واعرف التوافقات وتنبيهات الصيانة في مكان واحد.</p>
                    </div>
                </div>

                <div role="tablist" class="tabs tabs-boxed bg-base-200 p-1.5 mb-5">
                    <a role="tab" class="tab tab-active flex-1 h-10 font-bold">تسجيل الدخول</a>
                    <a role="tab" onclick="alert('شاشة إنشاء حساب')" class="tab flex-1 h-10 font-semibold">إنشاء حساب</a>
                </div>

                <div id="loginFormContainer">
                    <form onsubmit="handleLoginSubmit(event)" class="space-y-4">
                        <label class="form-control w-full">
                            <div class="label pb-1"><span class="label-text font-semibold">رقم الهاتف</span></div>
                            <input type="text" id="loginPhone" required inputmode="tel" autocomplete="username" class="input input-bordered w-full bg-base-200" dir="ltr">
                        </label>
                        <label class="form-control w-full">
                            <div class="label pb-1"><span class="label-text font-semibold">رمز المرور</span></div>
                            <div class="input input-bordered flex items-center gap-2 bg-base-200">
                                <input type="password" id="loginPassword" required autocomplete="current-password" class="grow min-w-0" dir="ltr">
                                <button type="button" onclick="togglePasswordVisibility('loginPassword', 'loginEyeIcon')" class="btn btn-ghost btn-xs btn-circle" aria-label="إظهار أو إخفاء رمز المرور">
                                    <svg id="loginEyeIcon" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                                    </svg>
                                </button>
                            </div>
                        </label>
                        <label class="label cursor-pointer justify-start gap-2 py-0">
                            <input type="checkbox" id="rememberMe" class="checkbox checkbox-primary checkbox-sm">
                            <span class="label-text font-semibold">تذكرني</span>
                        </label>
                        <button type="submit" class="btn btn-primary btn-block text-base">تسجيل الدخول</button>
                    </form>
                </div>

                <div class="divider text-xs text-base-content/50 my-5">أو</div>

                <button type="button" onclick="loginAsVisitor()" class="btn btn-outline btn-block">الدخول كزائر</button>
            </div>
        </div>
    `;
    document.getElementById('appContainer').innerHTML = html;

    if (localStorage.getItem('saved_phone')) {
        const phoneInput = document.getElementById('loginPhone');
        const passInput = document.getElementById('loginPassword');
        const rememberCheckbox = document.getElementById('rememberMe');
        if (phoneInput) phoneInput.value = localStorage.getItem('saved_phone');
        if (passInput) passInput.value = localStorage.getItem('saved_password');
        if (rememberCheckbox) rememberCheckbox.checked = true;
    }
}

async function handleLoginSubmit(e) {
    e.preventDefault();
    const phone = document.getElementById('loginPhone').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const rememberMe = document.getElementById('rememberMe')?.checked;

    if (rememberMe) {
        localStorage.setItem('saved_phone', phone);
        localStorage.setItem('saved_password', password);
    } else {
        localStorage.removeItem('saved_phone');
        localStorage.removeItem('saved_password');
    }

    const { data, error } = await supabaseClient.rpc('login', {
        p_phone_number: phone,
        p_password: password
    });

    if (error || !data || !data.id) {
        showSystemAlert("خطأ في تسجيل الدخول", phone || "غير متوفر", "فشل التحقق", error?.message || "بيانات غير صحيحة");
        return;
    }

    currentUserId = data.id;

    try {
        const profileRes = await supabaseClient.rpc('get_personal_profile', {
            p_user_id: currentUserId
        });
        if (profileRes.data && profileRes.data.success !== false) {
            currentUserRole = profileRes.data.user_role || '';
            currentUserName = profileRes.data.user_name || '';
            currentUserPhone = profileRes.data.phone_number || '';
        }
    } catch (err) {
        console.error("Error fetching user header profile:", err);
    }

    try {
        await supabaseClient.rpc('update_last_active_at', {
            target_user_id: currentUserId
        });
    } catch (err) {
        console.error("Instant heartbeat error:", err);
    }

    startHeartbeat();
    renderMainDashboard();
    loadDynamicMenuIntoSidebar();
}

function loginAsVisitor() {
    currentUserId = null;
    currentUserRole = "";
    currentUserName = "";
    currentUserPhone = "";
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    renderMainDashboard();
    loadDynamicMenuIntoSidebar();
}
