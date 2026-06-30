# 商店截图

## 自动抓取

```bash
# 终端 1
cd backend && docker-compose up -d && go run ./cmd/api

# 终端 2
cd frontend && npm run dev

# 终端 3
cd mobile/store-listing/assets/screenshots
npm install playwright sharp --no-save
npx playwright install chromium
node capture.mjs
```

环境变量 `PEIDU_URL` 可指向 staging（默认 `http://localhost:3000`）。

## 输出尺寸

| 目录 | 逻辑分辨率 | 输出（@3x） | 用途 |
|------|------------|-------------|------|
| `ios/` | 430×932 | 1290×2796 | App Store iPhone 6.7" |
| `android/` | 360×800 | 1080×2400 | 应用宝 / Google Play |

## 推荐场景（capture.mjs 已配置）

1. `01-home` — 书库首页
2. `02-discover` — 发现页
3. `03-shelf` — 我的书架
4. `04-groups` — 共读小组
5. `05-profile` — 个人主页

**阅读器截图**需手动进入某章 `/read/:chapterId` 后补抓（脚本可扩展）。

## 应用宝宣传图

打开 `promo-template.html`，浏览器全屏截图或打印为 PDF → 导出 **1080×540** PNG。

## 注意

- 截图前用真实数据或好看的 seed 数据，避免空白页
- 隐藏开发者工具、地址栏（Playwright 无地址栏）
- 检查无敏感测试账号信息外露
