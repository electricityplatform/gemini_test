// =====================================================================
// core/config.js — الثوابت وإعدادات الاتصال (مفيهاش حالة متغيرة)
// =====================================================================
const SUPABASE_URL = 'https://glwwvrgvbfygqbmqlnfn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_bCXPU0JSPeF-tG4OkHSXsQ_wyyRyC0w';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ---------- المحافظات ----------
const EGYPTIAN_GOVERNORATES = [
    "أسوان", "الأقصر", "قنا", "البحر الأحمر", "الوادي الجديد", "سوهاج", "أسيوط",
    "المنيا", "بني سويف", "الجيزة", "القاهرة", "سيناء", "بورسعيد", "كفر الشيخ",
    "دمياط", "الدقهلية", "الشرقية", "الغربية", "المنوفية", "الفيوم", "بحيرة",
    "الإسكندرية", "مطروح"
];

// ---------- الماركات (key = اسم الماركة اللي بيتبعت لدوال الداتابيز) ----------
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

// ---------- الرتب المسموح لها تدرج/تحذف صفوف (الصلاحية الفعلية في الداتابيز كمان) ----------
const DATA_CENTER_ROW_MANAGER_ROLES = ['أدمن', 'admin', 'مدير', 'head', 'manager'];

const CG_PART_LABELS = {
    screen: 'شاشة',
    battery: 'بطارية',
    back_cover: 'ضهرية',
    charging_flex_cable: 'فلاتة شحن',
    charging_linking_flex_cable: 'فلاتة ربط شحن',
    screen_linking_flex_cable: 'فلاتة ربط شاشة',
    power_flex_cable: 'فلاتة باور',
    frame: 'فريم',
    middle_frame: 'ميدل',
    internal_speaker: 'سماعة داخلية',
    external_speaker: 'سماعة خارجية',
    loud_speaker: 'علبة جرس',
    socket: 'سوكيت'
};
