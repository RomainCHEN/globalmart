# 系统功能与需求落实报告 (System Walkthrough)

根据《ISP-AIAP System Specification 2025_2026.pdf》文档，我对当前电商系统 (GlobalMart) 的代码库进行了全面排查。系统已经非常成熟，针对您要求实现的 **Block A, B, F, W, T, U**，我进行了功能验证、细节完善以及相应的 Bug 修复。以下是具体的落实情况：

## 1. Block A - Core functions (核心功能)
*   **状态：** 完美实现 ✅
*   **功能验证与完善：**
    *   **A1 (注册与收货地址)：** 在 `pages/Auth.tsx` 中，买家注册时已集成 `AddressSelector`，确保用户能够输入完整的收货地址。
    *   **A2-A4 (浏览与搜索)：** 未登录状态下可进行全站搜索与过滤（已在 `Shop.tsx` 和后端的 `/products` 接口中实现）。针对访客的购物车操作限制，也在之前的修改中加入了严格的登录拦截。
    *   **A5 (长列表导航)：** `pages/Shop.tsx` 中已包含 `Load More`（加载更多）按钮和分页状态管理，满足长商品列表的导航需求。
    *   **A14-A20 (管理后台)：** `pages/Dashboards.tsx` 中的卖家后台已支持通过关键词或产品 ID (A15) 搜索商品，上下架商品 (A18)，以及按时间倒序查看订单 (A19/A20)。

## 2. Block B - Multiple photos and order processing (多图与订单处理)
*   **状态：** 完美实现 ✅
*   **功能验证与完善：**
    *   **B1 (多图支持)：** 数据库设计中已存在 `product_images` 表。在 `Dashboards.tsx` 的商品编辑界面，卖家可上传并管理多张图片，设置主图和拖拽排序。
    *   **B2 (基本订单流程)：** 在 `server/routes/orders.js` 与前端订单详情页中，实现了状态流转机制 (`pending` -> `shipped` -> `delivered` / `hold` / `cancelled` / `refunded`)。
    *   **B3 & B4 (过滤与时间记录)：** 订单管理面板支持按状态筛选，并在 `Order.tsx` 和数据库层面记录了各个状态变更的具体时间戳（如 `shipped_at`, `cancelled_at`）。

## 3. Block F - Multiple vendors (多供应商支持)
*   **状态：** 完美实现 ✅
*   **功能验证与完善：**
    *   **F1-F3 (开设与管理店铺)：** 卖家在注册时选择 Seller 角色，随后在后台可创建自己的 `store`（包括双语名称、描述和 Logo）。
    *   **F4 (按店铺拆分订单 - 核心)：** 在 `pages/Order.tsx` 的 `handlePlaceOrder` 中，购物车结算时能够自动按 `store_id` 分组。如果用户的购物车中包含来自不同商家的商品，系统会在后台分别生成独立的 Purchase Order。

## 4. Block W - Accessibility (可访问性与国际化)
*   **状态：** 完美实现 ✅
*   **功能验证与完善：**
    *   **国际化 (i18n)：** 系统全面引入了双语支持（中/英）。商品标题、描述、规格以及所有 UI 文本（通过 `translations_values.ts` 及 `I18nProvider`）均实现了动态切换。
    *   **可访问性 (Accessibility)：** 在表单（如登录、注册表单）以及关键交互按钮中，添加了符合 WCAG 标准的 `aria-label`、`role="form"`、`aria-required` 属性，增强了屏幕阅读器用户的体验。高对比度的 Brutalism UI 风格也符合视觉可见性的要求。

## 5. Block T - User generated content (用户生成内容 UGC)
*   **状态：** 完美实现 ✅
*   **功能验证与完善：**
    *   **评价与评分：** 在 `pages/Shop.tsx` 和后端 `server/routes/reviews.js` 中实现了基于购买记录的评论机制。用户能留下 1-5 星的评分与文字评论。
    *   **数据联动：** 数据库中部署了 `update_product_rating` 触发器，一旦有新评论提交，自动更新 `products` 表中的平均 `rating` 和 `review_count`，直观地呈现在前台。

## 6. Block U - Wish list and promotional pricing strategy (心愿单与促销定价)
*   **状态：** 补充完善 ✅
*   **功能验证与完善：**
    *   **心愿单基础：** 系统已支持用户将商品加入心愿单（保存至 `wishlists` 数据库表）。
    *   **促销策略升级 (本次新增)：** 为了落实该 Block 中“刺激购买与促销提示”的要求，我在 `pages/Dashboards.tsx` 的心愿单面板中加入了**降价促销检测机制**。如果用户心愿单中的商品出现了降价（即 `original_price > price`），系统会显示醒目的 `ON SALE`（促销中）红色角标，并同时划线展示原价和高亮展示现价，利用心理学促销策略引导用户完成购买。

## 修复的 Bug (Bug Fixes)
在梳理和完善上述 Block 的过程中，我一并修复了之前存在的两个系统级 Bug：
1.  **登录状态刷新丢失：** 在 `App.tsx` 中引入了全局 `authLoading` 防护机制。修复了用户刷新页面时，因会话尚未从 localStorage 完全恢复而导致的瞬间跳转到登录页的问题。
2.  **卖家订单不可见：** 修复了 `server/routes/orders.js` 中 `GET /seller` 的后端查询逻辑。原逻辑过于依赖 `single()` 调用，如果卖家未完善店铺信息则会报错中断。新逻辑全面支持通过商品归属直接关联 `order_items`，确保卖家能够无误地查看到属于自己的所有商品订单。