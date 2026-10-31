// =====================================================================
// features/data-center/sheets.js — تعريفات شيتات مركز البيانات (config بس، الشغل في ui/sheet-factory.js)
// =====================================================================

// ---------- شيتات بسيطة (id + عمود اسم + created_at) ----------
function defineSimpleSheet({ id, table, nameCol, title, nameLabel, searchPlaceholder }) {
    Sheets.define({
        id,
        title: () => title,
        rpc: {
            get:      `get_${table}_for_data_center`,
            update:   `update_${table}_for_data_center`,
            insert:   `insert_${table}_for_data_center`,
            insertAt: `insert_${table}_at_position_for_data_center`,
            remove:   `delete_${table}_at_position_for_data_center`
        },
        colLabel: col => col === 'created_at' ? 'تاريخ الانشاء' : col === nameCol ? nameLabel : '',
        searchRe: new RegExp(`^${nameCol}$`),
        searchPlaceholder,
        exportPrefix: table
    });
}

defineSimpleSheet({ id: 'brands',     table: 'brands',      nameCol: 'brand_names',      title: 'جدول الماركات',  nameLabel: 'اسم الماركة',      searchPlaceholder: 'ابحث في اسم الماركة' });
defineSimpleSheet({ id: 'spareParts', table: 'spare_parts',  nameCol: 'spare_part_items', title: 'جدول قطع الغيار', nameLabel: 'اسم قطعة الغيار', searchPlaceholder: 'ابحث في اسم قطعة الغيار' });
defineSimpleSheet({ id: 'partitions', table: 'partitions',   nameCol: 'partition_names',  title: 'جدول الأقسام',   nameLabel: 'اسم القسم',        searchPlaceholder: 'ابحث في اسم القسم' });

// ---------- الموديلات (لكل ماركة) ----------
Sheets.define({
    id: 'models',
    perBrand: true,
    pickerTitle: 'جداول الموديلات - اختر الماركة',
    title: ctx => `جدول موديلات ${ctx.label}`,
    rpc: {
        get:      'get_models_for_data_center',
        update:   'update_models_for_data_center',
        insert:   'insert_models_for_data_center',
        insertAt: 'insert_model_at_position_for_data_center',
        remove:   'delete_model_at_position_for_data_center'
    },
    rowActions: 'managers',
    keyCol: ctx => `${ctx.brand}_model_names`,
    colLabel: col => {
        if (col === 'created_at') return 'تاريخ الإنشاء';
        if (/_model_names$/.test(col)) return 'اسم الموديل';
        if (/_model_codes$/.test(col)) return 'كود الموديل';
        if (/_battery_codes$/.test(col)) return 'كود البطارية';
        return '';
    },
    searchRe: /_model_names$|_model_codes$|_battery_codes$/,
    searchPlaceholder: 'ابحث بالاسم أو كود الموديل أو كود البطارية',
    loadingRows: 8,
    exportPrefix: 'models',
    // لو الجدول فاضي: نحاول نجيب الأعمدة الحقيقية، وإلا نستخدم الأسماء المتوقعة
    async fallbackColumns(ctx) {
        const { data } = await Api.rpc('get_models_columns_for_data_center', { p_table: `${ctx.brand}_models` });
        if (Array.isArray(data) && data.length) return data;
        return ['id', `${ctx.brand}_phone_name`, `${ctx.brand}_phone_code`, `${ctx.brand}_screen_compatibility`, `${ctx.brand}_battery_model`];
    }
});

// ---------- مجموعات التوافقات (لكل ماركة) ----------
Sheets.define({
    id: 'compatGroups',
    perBrand: true,
    pickerTitle: 'جداول مجموعات التوافقات - اختر الماركة',
    title: ctx => `مجموعات توافقات ${ctx.label}`,
    rpc: {
        get:      'get_model_spare_part_compatibility_groups_for_data_center',
        update:   'update_model_spare_part_compatibility_groups_for_data_center',
        insert:   'insert_model_spare_part_compatibility_groups_for_data_center',
        insertAt: 'insert_model_spare_part_compatibility_group_at_position_for_data_center',
        remove:   'delete_model_spare_part_compatibility_group_at_position_for_data_center'
    },
    colLabel: (col, ctx) => {
        if (col === 'created_at') return 'تاريخ الانشاء';
        const key = String(col).replace(`${ctx.brand}_model_`, '').replace(/_compatibility_groups$/, '');
        const base = CG_PART_LABELS[key];
        return base ? `مجموعات توافق ${base}` : '';
    },
    searchRe: /_compatibility_groups$/,
    searchPlaceholder: 'ابحث في أي عمود توافق',
    notFound: 'جدول مجموعات التوافقات غير موجود لهذه الماركة',
    exportPrefix: 'compatibility_groups'
});

// ---------- التوافقات المحدثة (تعديل فقط) ----------
Sheets.define({
    id: 'compat',
    perBrand: true,
    updateOnly: true,
    pickerTitle: 'جداول التوافقات - اختر الماركة',
    title: ctx => `توافقات ${ctx.label}`,
    rpc: {
        get:    'get_model_spare_part_compatibility_for_data_center',
        update: 'update_model_spare_part_compatibility_for_data_center'
    },
    keyCol: ctx => `${ctx.brand}_model_names`,
    colLabel: (col, ctx) => {
        if (col === `${ctx.brand}_model_names`) return 'اسم الموديل';
        if (col === 'id') return 'م';
        if (col === 'created_at') return 'تاريخ الانشاء';
        const isGroups = /_compatibility_selected_groups$/.test(col);
        const key = String(col)
            .replace(`${ctx.brand}_model_`, '')
            .replace(/^spare_part_/, '')
            .replace(/_compatibility(_selected_groups)?$/, '');
        const base = CG_PART_LABELS[key];
        if (!base) return col;
        return isGroups ? `مجموعات توافق ${base} المختارة` : `توافق ${base}`;
    },
    searchRe: /_model_names$|_compatibility$|_compatibility_selected_groups$/,
    searchPlaceholder: 'ابحث في اسم الموديل أو أي عمود توافق',
    notFound: 'جدول التوافقات غير موجود لهذه الماركة',
    exportPrefix: 'model_spare_part_compatibility'
});

// ---------- تنبيهات الصيانة (تعديل فقط) ----------
Sheets.define({
    id: 'alerts',
    perBrand: true,
    updateOnly: true,
    pickerTitle: 'جداول تنبيهات الصيانة - اختر الماركة',
    title: ctx => `جداول التنبيهات - ${ctx.label}`,
    rpc: {
        get:    'get_brand_model_spare_part_maintenance_alerts_for_data_center',
        update: 'update_model_spare_part_maintenance_alerts_for_data_center'
    },
    keyCol: ctx => `${ctx.brand}_model_names`,
    colLabel: (col, ctx) => {
        if (col === `${ctx.brand}_model_names`) return 'اسم الموديل';
        if (col === 'id') return 'م';
        if (col === 'created_at') return 'تاريخ الانشاء';
        const key = String(col)
            .replace(new RegExp('^' + ctx.brand + '_(model_)?'), '')
            .replace(/_spare_part_maintenance_alerts$/, '')
            .replace(/_maintenance_alerts$/, '')
            .replace(/_alerts$/, '');
        const base = CG_PART_LABELS[key];
        return base ? `تنبيهات صيانة ${base}` : col;
    },
    searchRe: /_model_names$|_alerts$|_maintenance_alerts$/,
    searchPlaceholder: 'ابحث في اسم الموديل أو التنبيهات',
    exportPrefix: 'maintenance_alerts'
});
