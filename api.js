// =====================================================================
// core/api.js — غلاف واحد لكل نداءات الداتابيز (rpc)
//   Api.rpc(name, params)      -> { data, error }   (بيضيف p_user_id تلقائياً وبيفك JSON)
//   Api.mutate(name, params)   -> { ok, message, data, error }  للدوال اللي بترجع { success, message }
// =====================================================================
const Api = {
    parse(data) {
        if (typeof data === 'string') {
            try { return JSON.parse(data); } catch (e) { /* نص عادي */ }
        }
        return data;
    },

    async rpc(name, params = {}, { withUser = true } = {}) {
        const body = (withUser && currentUserId != null && !('p_user_id' in params))
            ? { p_user_id: currentUserId, ...params }
            : params;
        try {
            const { data, error } = await supabaseClient.rpc(name, body);
            if (error) return { data: null, error: error.message || String(error) };
            return { data: Api.parse(data), error: null };
        } catch (e) {
            console.error('rpc failed:', name, e);
            return { data: null, error: 'تعذر الاتصال بالخادم' };
        }
    },

    async mutate(name, params = {}, failMessage = 'فشلت العملية') {
        const { data, error } = await Api.rpc(name, params);
        if (error) return { ok: false, message: error, data: null, error };
        if (!data || !data.success) return { ok: false, message: (data && data.message) || failMessage, data, error: null };
        return { ok: true, message: data.message || '', data, error: null };
    }
};
