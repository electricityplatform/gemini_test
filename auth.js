// ================= شاشة تسجيل الدخول (DaisyUI: card / tabs / input / btn / divider) =================
function renderLoginScreen() {
    const eye = `<svg id="loginEyeIcon" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>`;
    const html = `
        <div class="auth-screen">
            <div class="auth-hero teal-floral" style="background-image:${floralBgSvg().replace(/"/g, "'")}">
                <div class="brand">${uiIcon('bolt', 'w-6 h-6')}<span>ELECTRICITY</span></div>
            </div>
            <div class="auth-card">
                <div class="auth-avatar">${uiIcon('user', 'w-9 h-9')}</div>
                <h1 class="text-center font-bold text-lg text-primary mb-4">تسجيل الدخول</h1>
                <form id="loginFormContainer" onsubmit="handleLoginSubmit(event)" class="flex flex-col gap-2">
                    <div class="line-field">
                        ${uiIcon('device', 'w-5 h-5')}
                        <input type="text" id="loginPhone" required inputmode="tel" autocomplete="username" placeholder="رقم الهاتف" dir="ltr">
                    </div>
                    <div class="line-field">
                        ${uiIcon('cog', 'w-5 h-5')}
                        <input type="password" id="loginPassword" required autocomplete="current-password" placeholder="رمز المرور" dir="ltr">
                        <button type="button" onclick="togglePasswordVisibility('loginPassword', 'loginEyeIcon')" aria-label="إظهار أو إخفاء رمز المرور">${eye}</button>
                    </div>
                    <label class="label cursor-pointer justify-start gap-2 py-2">
                        <input type="checkbox" id="rememberMe" class="checkbox checkbox-primary checkbox-sm">
                        <span class="label-text text-primary font-semibold text-xs">تذكرني</span>
                    </label>
                    <button type="submit" class="btn btn-primary w-40 mx-auto">دخول</button>
                    <button type="button" onclick="loginAsVisitor()" class="btn btn-ghost btn-sm text-primary mx-auto mt-1">الدخول كزائر</button>
                </form>
                <div class="auth-foot" onclick="alert('شاشة إنشاء حساب')">ليس لديك حساب؟ إنشاء حساب</div>
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
