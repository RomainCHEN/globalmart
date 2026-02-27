import ExcelJS from 'exceljs';
import { writeFileSync } from 'fs';

const workbook = new ExcelJS.Workbook();
workbook.creator = 'GlobalMart';
workbook.created = new Date();

// ===== Utility: styled header row =====
function styleHeader(row, defaultColor = 'FF2563EB') {
    row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: defaultColor } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Arial' };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = {
            top: { style: 'thin' }, bottom: { style: 'thin' },
            left: { style: 'thin' }, right: { style: 'thin' }
        };
    });
}

function styleDataRow(row, idx) {
    const bgColor = idx % 2 === 0 ? 'FFF8FAFC' : 'FFFFFFFF';
    row.eachCell({ includeEmpty: true }, cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
        cell.alignment = { vertical: 'middle', wrapText: true };
    });
}

// =============================================
// Sheet 1: 商品导入模板
// =============================================
const ws = workbook.addWorksheet('商品导入模板', {
    properties: { defaultColWidth: 20 }
});

const headers = [
    '商品名称 (English) *',
    '商品名称 (中文)',
    '商品简介 (English) *',
    '商品简介 (中文)',
    '商品分类 *',
    '所属店铺 *',
    '售价 (USD) *',
    '原价 (USD)',
    '库存数量 *',
    '商品主图 *\n(URL 或 本地文件名)',
    '附加图片\n(URL或文件名, 用 | 分隔)',
    '标签 (用 | 分隔)',
    '规格参数-参数名1',
    '规格参数-参数值1',
    '规格参数-参数名2',
    '规格参数-参数值2',
    '规格参数-参数名3',
    '规格参数-参数值3',
    '规格参数-参数名4',
    '规格参数-参数值4',
    '评分 (1-5)',
    '备注',
];

const headerRow = ws.addRow(headers);
styleHeader(headerRow);
headerRow.height = 42;

// Column widths
const widths = [35, 25, 50, 40, 20, 24, 12, 12, 10, 38, 45, 22, 18, 28, 18, 28, 18, 28, 18, 28, 10, 25];
widths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

// Mark required columns with red header
[0, 2, 4, 5, 6, 8, 9].forEach(i => {
    const cell = headerRow.getCell(i + 1);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC2626' } };
});

// Example data rows
const examples = [
    [
        'Wireless Noise Cancelling Headphones', '无线降噪耳机',
        'Immersive sound with active noise cancellation and 30-hour battery life.', '沉浸式音质，配备主动降噪技术，续航30小时。',
        'Electronics', 'TechZone Digital',
        299.00, '', 100,
        'https://example.com/headphones.jpg',
        'https://example.com/hp-side.jpg|https://example.com/hp-case.jpg',
        'NEW',
        'Battery', '30 Hours', 'Noise Cancel', 'Adaptive ANC', 'Connection', 'BT 5.3', 'Driver', '40mm',
        4.7, '外链图片示例'
    ],
    [
        'Smart Watch Ultra', '智能手表 Ultra',
        'Advanced health tracking with ECG, SpO2, and GPS. Titanium body.', '先进健康监测，支持心电图、血氧、GPS。钛合金机身。',
        'Electronics', 'TechZone Digital',
        449.00, 499.00, 35,
        'smartwatch_main.jpg',
        'smartwatch_side.jpg|smartwatch_back.jpg',
        'HOT|PREMIUM',
        'Display', 'AMOLED 1.9"', 'Battery', '72 Hours', 'Water Resist', '100m', 'Material', 'Titanium',
        4.9, '本地文件示例（导入时自动上传）'
    ],
    [
        'Yonex Astrox 99 Pro', '',
        'Built for absolute dominance. The choice of champions.', '',
        'Sports & Outdoors', 'SportsPro Official Store',
        210.00, 240.00, 25,
        'https://example.com/racket.jpg', '',
        'HOT|POWER',
        'Weight', '3U (88g)', 'Balance', 'Head Heavy', 'Flex', 'Stiff', 'String Tension', '20-28 lbs',
        4.8, ''
    ],
    [
        'Urban Street Sneakers', '都市潮流运动鞋',
        'Premium leather sneakers with memory foam insoles and platform sole.', '高级皮革运动鞋配记忆泡沫鞋垫，厚底设计。',
        'Fashion', 'Urban Style Co.',
        139.00, '', 70,
        'sneakers_hero.jpg',
        'sneakers_side.jpg|sneakers_sole.jpg|sneakers_box.jpg',
        'HOT',
        '颜色/Color', '黑色/Black|白色/White|灰色/Grey', '尺码/Size', '38|39|40|41|42|43|44', '材质/Material', '真皮/Genuine Leather', '', '',
        4.7, '多可选项值用 | 分隔'
    ],
    [
        'Pour-Over Coffee Maker Set', '手冲咖啡套装',
        'Barista-grade pour-over set with gooseneck kettle and filter stand.', '专业手冲咖啡套装，含细嘴壶和滤杯架。',
        'Home & Kitchen', 'HomeLife Essentials',
        89.00, '', 60,
        'https://example.com/coffee-set.jpg',
        'coffee-kettle.jpg|coffee-filter.jpg',
        'HOT',
        'Capacity', '600ml', 'Material', 'Borosilicate Glass', '', '', '', '',
        4.8, '混合使用URL和本地文件'
    ],
    [
        'The Art of Clean Code', '代码整洁之道',
        'Essential guide to writing maintainable, elegant software. 2024 Edition.', '编写可维护、优雅软件的必备指南，2024最新版。',
        'Books & Media', 'HomeLife Essentials',
        34.99, '', 300,
        'https://example.com/book-cover.jpg', '',
        'NEW',
        'Pages', '420', 'Format', 'Hardcover|Paperback|eBook', 'Language', 'English', 'ISBN', '978-0-13-235088-4',
        4.9, ''
    ],
];

examples.forEach((row, idx) => {
    const dataRow = ws.addRow(row);
    styleDataRow(dataRow, idx);
});

// Freeze first row
ws.views = [{ state: 'frozen', ySplit: 1 }];

// Data validation for categories (column 5)
for (let r = 2; r <= 50; r++) {
    ws.getCell(r, 5).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"Electronics,Sports & Outdoors,Home & Kitchen,Fashion,Books & Media,Health & Beauty"'],
        showErrorMessage: true,
        errorTitle: '无效分类',
        error: '请选择有效的商品分类'
    };
}

// Data validation for rating (column 21)
for (let r = 2; r <= 50; r++) {
    ws.getCell(r, 21).dataValidation = {
        type: 'decimal',
        allowBlank: true,
        operator: 'between',
        formulae: [0, 5],
        showErrorMessage: true,
        errorTitle: '无效评分',
        error: '评分需在 0 - 5 之间'
    };
}


// =============================================
// Sheet 2: 填写说明
// =============================================
const helpWs = workbook.addWorksheet('填写说明');
helpWs.getColumn(1).width = 32;
helpWs.getColumn(2).width = 70;

const helpHeader = helpWs.addRow(['字段名', '填写说明']);
styleHeader(helpHeader);
helpHeader.height = 32;

const helpData = [
    ['商品名称 (English) *', '必填。英文商品名称，建议简洁有力，突出卖点'],
    ['商品名称 (中文)', '选填。中文商品名称。如留空，导入后可在卖家后台使用 AI 翻译自动生成'],
    ['商品简介 (English) *', '必填。英文商品描述，1-2 句话概括核心卖点和差异化特性'],
    ['商品简介 (中文)', '选填。中文商品描述。如留空，导入后可使用 AI 翻译自动生成'],
    ['商品分类 *', '必填。下拉选择，共 6 个分类：\n• Electronics（电子产品）\n• Sports & Outdoors（体育户外）\n• Home & Kitchen（家居厨房）\n• Fashion（时尚）\n• Books & Media（书籍媒体）\n• Health & Beauty（健康美容）'],
    ['所属店铺 *', '必填。填写店铺名称，必须与网站已注册的店铺名称完全一致'],
    ['售价 (USD) *', '必填。实际销售价格，数字格式，如 299.00'],
    ['原价 (USD)', '选填。打折前的原价。填写后网站会自动显示折扣标签和划线价'],
    ['库存数量 *', '必填。正整数，如 100。库存为 0 时商品显示为"缺货"'],
    ['商品主图 *', '必填。支持两种方式：\n① 外链URL：直接填写图片链接，如 https://xxx.com/img.jpg\n② 本地文件：填写文件名，如 product_photo.jpg（导入时系统自动上传到服务器）\n\n支持格式：JPG, PNG, WebP, GIF，单张最大 5MB'],
    ['附加图片', '选填。多张图片用 | 分隔。同样支持 URL 和本地文件名混合使用。\n示例：side_view.jpg|https://cdn.com/back.jpg|detail.png\n\n建议提供 2-4 张不同角度的附加图'],
    ['标签', '选填。多个用 | 分隔。常用标签：\n• HOT（热门）\n• NEW（新品）\n• SALE（促销）\n• PREMIUM（精品）\n• POWER / SPEED / CONTROL（适用于运动品类）'],
    ['规格参数（4组）', '选填。每组包含"参数名"和"参数值"两列。\n• 参数名：如 颜色/Color、尺码/Size、重量/Weight\n• 参数值：如果有多个选项，用 | 分隔\n  例：黑色/Black|白色/White|灰色/Grey\n\n最多 4 组规格参数'],
    ['评分 (1-5)', '选填。0.0 - 5.0 之间的小数，如 4.7。留空则默认 0'],
    ['备注', '选填。运营备注，仅供内部参考，不会导入到网站'],
];

helpData.forEach((row, idx) => {
    const r = helpWs.addRow(row);
    const bgColor = idx % 2 === 0 ? 'FFF1F5F9' : 'FFFFFFFF';
    r.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.alignment = { vertical: 'top', wrapText: true };
        cell.font = { size: 10.5, name: 'Arial' };
        cell.border = {
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
    });
    // Taller rows for multi-line content
    const lines = String(row[1]).split('\n').length;
    r.height = Math.max(28, lines * 16);
});

// Important note row
helpWs.addRow([]);
const noteRow = helpWs.addRow(['⚠️ 图片说明', '本模板同时支持"外链URL"和"本地文件上传"两种图片方式：\n\n1. 外链 URL：直接填写完整链接（以 http:// 或 https:// 开头），无需额外操作\n2. 本地文件：填写文件名（如 product.jpg），将图片文件与本 Excel 放在同一文件夹中，导入时系统会自动上传到 Supabase 云存储\n\n✅ 可以在同一行中混合使用两种方式']);
noteRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF7ED' } };
    cell.font = { size: 11, bold: true, name: 'Arial' };
    cell.alignment = { vertical: 'top', wrapText: true };
    cell.border = {
        top: { style: 'medium', color: { argb: 'FFFB923C' } },
        bottom: { style: 'medium', color: { argb: 'FFFB923C' } },
        left: { style: 'medium', color: { argb: 'FFFB923C' } },
        right: { style: 'medium', color: { argb: 'FFFB923C' } }
    };
});
noteRow.height = 100;


// =============================================
// Sheet 3: 分类与店铺参考
// =============================================
const refWs = workbook.addWorksheet('分类与店铺参考');
refWs.getColumn(1).width = 25;
refWs.getColumn(2).width = 18;
refWs.getColumn(3).width = 5;
refWs.getColumn(4).width = 28;
refWs.getColumn(5).width = 35;

const catHeader = refWs.addRow(['分类名称 (Category)', '分类标识 (Slug)', '', '店铺名称 (Store)', '店铺描述']);
catHeader.eachCell(cell => {
    if (cell.value) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Arial' };
        cell.alignment = { horizontal: 'center' };
    }
});
catHeader.height = 28;

const cats = [
    ['Sports & Outdoors', 'sports'],
    ['Electronics', 'electronics'],
    ['Home & Kitchen', 'home'],
    ['Fashion', 'fashion'],
    ['Books & Media', 'books'],
    ['Health & Beauty', 'health'],
];
const stores = [
    ['SportsPro Official Store', '体育用品和户外装备 — 球拍、运动鞋、健身器材'],
    ['TechZone Digital', '电子产品和数码配件 — 耳机、手表、充电器'],
    ['HomeLife Essentials', '家居和厨房用品 — 餐具、灯具、厨房工具'],
    ['Urban Style Co.', '时尚服饰和生活配件 — 鞋、包、太阳镜'],
];

for (let i = 0; i < Math.max(cats.length, stores.length); i++) {
    const row = [
        cats[i]?.[0] || '', cats[i]?.[1] || '', '',
        stores[i]?.[0] || '', stores[i]?.[1] || ''
    ];
    const r = refWs.addRow(row);
    styleDataRow(r, i);
    r.height = 24;
}


// =============================================
// Sheet 4: 标签速查
// =============================================
const tagWs = workbook.addWorksheet('标签速查');
tagWs.getColumn(1).width = 18;
tagWs.getColumn(2).width = 22;
tagWs.getColumn(3).width = 45;

const tagHeader = tagWs.addRow(['标签 (Tag)', '中文含义', '适用场景']);
styleHeader(tagHeader, 'FF7C3AED');
tagHeader.height = 28;

const tags = [
    ['HOT', '热门', '销量高、强推荐的商品'],
    ['NEW', '新品', '新上架的商品'],
    ['SALE', '促销', '正在打折/有原价对比的商品'],
    ['PREMIUM', '精品', '高端/精选商品'],
    ['POWER', '力量型', '运动品类 — 侧重力量/攻击性'],
    ['SPEED', '速度型', '运动品类 — 侧重速度/灵活性'],
    ['CONTROL', '控制型', '运动品类 — 侧重精准控制'],
];

tags.forEach((row, idx) => {
    const r = tagWs.addRow(row);
    styleDataRow(r, idx);
    // Color the tag cell
    r.getCell(1).font = { bold: true, color: { argb: 'FF7C3AED' }, size: 11 };
});


// =============================================
// Save files
// =============================================
const outPath = 'c:/globalmart/GlobalMart_商品导入模板.xlsx';
await workbook.xlsx.writeFile(outPath);
console.log('✅ Excel template saved to:', outPath);

// Also regenerate CSV with BOM
const csvHeaders2 = headers.map(h => h.replace(/\n/g, ' ')); // flatten newlines in header
const BOM = '\uFEFF';
const csvHeaderLine = csvHeaders2.join(',');
const csvRows = examples.map(r => r.map(v => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
}).join(','));
const csvContent = BOM + csvHeaderLine + '\n' + csvRows.join('\n') + '\n';
writeFileSync('c:/globalmart/商品导入模板_GlobalMart_Product_Import_Template.csv', csvContent, 'utf8');
console.log('✅ CSV (with BOM) saved');
