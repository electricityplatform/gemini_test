# Electricity — هيكل المشروع

```
index.html
css/
  tokens.css        ألوان/مسافات/ظلال (فاتح + داكن) — المصدر الوحيد للألوان الجديدة
  base.css          الخط، الحركة، التركيز، السكرول
  components.css    أزرار، كروت، شريط أدوات، توست، نافذة تأكيد، هيدر
  sheet.css         شكل الشيت (جدول #sheetTable)
  legacy-dark.css   دارك مود الشاشات القديمة (Tailwind) — يتشال تدريجياً
js/
  core/             config • state • utils • api (غلاف rpc) • actions (event delegation) • router
  ui/               icons • toast (toast + confirm) • components • layout • sheet-core • sheet-factory
  features/
    auth/  dashboard/  profile/  settings/  seller/  operations/
    data-center/    menu • sheets (تعريفات الـ7 شيتات) • users
  app.js            نقطة البداية
```

## أسماء الملفات القديمة → الجديدة
| قديم | جديد |
|---|---|
| config.js | js/core/config.js + js/core/state.js |
| utils.js | js/core/utils.js |
| layout.js | js/ui/layout.js |
| 1-data-center-core.js | js/ui/sheet-core.js (+ الثوابت في core/config.js) |
| 2-data-center-menu.js | js/features/data-center/menu.js |
| 3-data-center-users.js | js/features/data-center/users.js |
| 4 / 5 / 6 / 7 / 8 / 9 / 10 | تعريفات في js/features/data-center/sheets.js + المصنع js/ui/sheet-factory.js |
| auth / dashboard / profile / general-settings / my-products / operation-center | js/features/<feature>/ |
| main.js | js/app.js |
| style.css | css/ (5 ملفات) |

## إضافة شيت جديد (مثال)
```js
Sheets.define({
    id: 'colors',
    title: () => 'جدول الألوان',
    rpc: { get: 'get_colors_for_data_center', update: 'update_colors_for_data_center',
           insert: 'insert_colors_for_data_center',
           insertAt: 'insert_colors_at_position_for_data_center',
           remove: 'delete_colors_at_position_for_data_center' },
    colLabel: c => c === 'color_names' ? 'اسم اللون' : '',
    searchRe: /^color_names$/
});
// وبعدين في menu.js:  'الألوان': { action: 'sheet.open', args: ['colors'] }
```

## قواعد الكود الجديد
- أي نص جاي من الداتابيز: `UI.esc()` / `escapeHtmlValue()` قبل ما يتحط في HTML.
- ممنوع `onclick="..."` — استخدم `data-action` عبر `Actions.attr('name', arg1, arg2)` و`Actions.register`.
- ممنوع `alert/confirm` — استخدم `UI.toast()` و`await UI.confirm({...})`.
- نداءات الداتابيز عبر `Api.rpc` / `Api.mutate` (بتضيف p_user_id وبتفك JSON).
