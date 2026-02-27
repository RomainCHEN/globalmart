<div align="center">

# 🌐 GlobalMart

**Your World. Your Market.**

一个全栈双语电商平台，采用 Neobrutalist 设计风格，支持中英文切换与 AI 翻译。

[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite)](https://vitejs.dev)
[![Express](https://img.shields.io/badge/Express-4-000?logo=express)](https://expressjs.com)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?logo=supabase)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)](https://typescriptlang.org)

</div>

---

## ✨ 功能特性

### 🛍️ 商品系统
- 商品目录，支持 6 大分类筛选、价格区间过滤、排序
- 分页加载（Load More）
- 商品标签体系（HOT / NEW / SALE / PREMIUM 等）
- 多图展示（主图 + 附加图片）
- 商品评论与评分系统

### 🌏 双语支持 (i18n)
- 中/英文一键切换，覆盖全站 UI
- 商品名称、描述、店铺信息均支持双语
- 分类名称和标签自动汉化
- 集成 **Gemini AI 翻译**，卖家可一键翻译商品信息

### 🏪 店铺系统
- 多卖家入驻，每个卖家可创建独立店铺
- 店铺主页展示商品列表、评分、认证状态
- 店铺信息支持中英文双语

### 👨‍💼 卖家后台 (Seller Hub)
- 商品 CRUD 管理
- **双模式图片上传**：本地拖拽上传至 Supabase Storage 或 粘贴外链 URL
- 店铺信息编辑（名称、简介、Logo）
- 订单管理

### 🛒 购物与订单
- 购物车（增减数量、删除商品）
- 心愿单
- 订单提交与状态追踪

### 🔐 用户系统
- 注册 / 登录（Supabase Auth）
- 角色区分：买家 / 卖家 / 管理员
- 管理员后台：用户管理、商品审核

---

## 🏗️ 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | React 18 + TypeScript + Vite |
| **样式** | TailwindCSS (Neobrutalist 主题) |
| **后端** | Express.js (Node.js) |
| **数据库** | Supabase (PostgreSQL) |
| **存储** | Supabase Storage (商品图片) |
| **认证** | Supabase Auth |
| **AI** | Google Gemini API (翻译) |

---

## 📁 项目结构

```
globalmart/
├── server/                  # Express 后端
│   ├── index.js             # 服务入口
│   ├── supabase.js          # Supabase 客户端
│   ├── middleware/auth.js   # 认证中间件
│   └── routes/
│       ├── products.js      # 商品 API
│       ├── stores.js        # 店铺 API
│       ├── orders.js        # 订单 API
│       ├── reviews.js       # 评论 API
│       ├── categories.js    # 分类 API
│       ├── auth.js          # 认证 API
│       ├── admin.js         # 管理员 API
│       ├── upload.js        # 图片上传 API
│       ├── translate.js     # AI 翻译 API
│       ├── seed.js          # 数据种子
│       └── migrate.js       # 数据库迁移
├── pages/
│   ├── Shop.tsx             # 商品列表 / 详情 / 店铺页
│   ├── Dashboards.tsx       # 卖家 & 管理员后台
│   ├── Auth.tsx             # 登录 / 注册
│   └── Order.tsx            # 订单页
├── api.ts                   # 前端 API 客户端
├── context.tsx              # React Context (全局状态)
├── i18n.tsx                 # 国际化配置
├── types.ts                 # TypeScript 类型定义
├── layouts.tsx              # 页面布局
├── App.tsx                  # 路由配置
├── index.tsx                # 入口文件
└── generate_template.mjs    # Excel 商品导入模板生成器
```

---

## 🚀 快速开始

### 前置要求

- [Node.js](https://nodejs.org/) v18+
- [Supabase](https://supabase.com/) 项目（免费即可）

### 1. 克隆项目

```bash
git clone https://github.com/RomainCHEN/globalmart.git
cd globalmart
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

创建 `.env.local` 文件：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
VITE_API_URL=http://localhost:3001/api
GEMINI_API_KEY=your-gemini-api-key
```

### 4. 数据库设置

在 Supabase SQL Editor 中创建所需表结构（categories, products, stores, profiles, orders 等），然后通过种子接口 `POST /api/seed` 填充示例数据。

### 5. 启动开发服务器

```bash
npm run dev
```

前端运行在 `http://localhost:3000`，后端 API 运行在 `http://localhost:3001`。

---

## 📸 预览

<table>
<tr>
<td align="center"><b>商品列表</b></td>
<td align="center"><b>店铺页面</b></td>
</tr>
<tr>
<td>分类筛选 · 价格过滤 · 标签系统</td>
<td>店铺详情 · 评分 · 商品数量</td>
</tr>
<tr>
<td align="center"><b>卖家后台</b></td>
<td align="center"><b>图片上传</b></td>
</tr>
<tr>
<td>商品管理 · 店铺编辑 · 订单管理</td>
<td>拖拽上传 · URL 粘贴 · 图片预览</td>
</tr>
</table>

---

## 📝 License

MIT © [RomainCHEN](https://github.com/RomainCHEN)
