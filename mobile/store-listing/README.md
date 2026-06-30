# M4c · 应用商店上架素材包

陪读（Peidu）App Store + 腾讯应用宝提交流程与素材规格。

## 应用信息

| 字段 | 值 |
|------|-----|
| 应用名称 | 陪读 |
| 英文名称 | Peidu |
| Bundle ID (iOS) | `com.peidu.reader` |
| Application ID (Android) | `com.peidu.reader` |
| 版本 | 1.0.0 |
| 主分类 | 图书 |
| 副分类 | 社交 / 生活方式 |
| 内容分级 | 4+ / 全年龄 |
| 隐私政策 URL | `https://<你的域名>/privacy` |

## 图标尺寸

生成脚本：`assets/icons/generate-icons.mjs`（输入 `icon-master.png` 或 `icon-master.svg`）

### iOS（App Store Connect）

| 用途 | 尺寸 | 输出路径 |
|------|------|----------|
| App Store | 1024×1024 | `assets/icons/ios/AppStore-1024.png` |
| iPhone | 180×180, 120×120, 87×87, 80×80, 60×60, 58×58, 40×40, 29×29, 20×20 | `assets/icons/ios/` |
| iPad | 167×167, 152×152, 76×76 | `assets/icons/ios/` |

### Android / 应用宝

| 用途 | 尺寸 | 输出路径 |
|------|------|----------|
| 应用图标 | 512×512 | `assets/icons/android/ic_launcher-512.png` |
| 自适应前景 | 432×432（安全区 288） | `assets/icons/android/ic_foreground-432.png` |
| 应用宝高清图标 | 512×512 | 同上 |

## 截图尺寸

抓取脚本：`assets/screenshots/capture.mjs`

### iOS App Store

| 设备 | 尺寸 | 最少张数 |
|------|------|----------|
| iPhone 6.7" | 1290×2796 | 3–10 |
| iPhone 6.5" | 1284×2778 | 3–10（可复用 6.7" 缩放） |
| iPad Pro 12.9" | 2048×2732 | 可选 |

推荐截图场景（按顺序）：

1. **书库首页** — 暖色氛围、继续阅读卡片
2. **阅读器** — 段评浮现在原句旁 +「结伴」开关
3. **书籍详情** — 章节目录与在场人数
4. **发现页** — 推荐与共读小组
5. **个人主页** — 被点亮、我的想法

### 应用宝 / Android

| 用途 | 尺寸 | 说明 |
|------|------|------|
| 应用截图 | 1080×1920 或 1080×2340 | 至少 3 张，竖屏 |
| 宣传图（Banner） | 1080×540 | 应用宝必填 |
| 闪屏（可选） | 1080×1920 | 品牌 + Slogan |

## 文案文件

- **App Store 中文**：`app-store/zh-CN/`
- **App Store 英文**：`app-store/en-US/`
- **应用宝**：`yingyongbao/`

复制粘贴到各平台后台即可；`metadata.json` 汇总了结构化字段。

## 提交流程

详见 [`CHECKLIST.md`](./CHECKLIST.md)。
