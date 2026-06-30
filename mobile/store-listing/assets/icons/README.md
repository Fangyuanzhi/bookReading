# 图标素材

## Master 文件

将 **1024×1024** 的 PNG 放在此目录，命名为 `icon-master.png`。

可使用：
- `icon-master.svg`（矢量源文件，用 Inkscape / Figma 导出 PNG）
- 设计稿导出的 `icon-master.png`

## 生成各平台尺寸

```bash
cd mobile/store-listing/assets/icons
npm install sharp --no-save
node generate-icons.mjs
```

输出：
- `ios/` — App Store 与各 iPhone/iPad 尺寸
- `android/` — 512 图标 + 自适应前景

## 尺寸对照

| 平台 | 尺寸 |
|------|------|
| App Store | 1024×1024 |
| Android 商店 | 512×512 |
| iPhone @3x | 180×180 |
| iPhone @2x | 120×120 |
| 应用宝宣传图内嵌 | 128×128（从 512 缩放） |

## 设计规范

- 主色：`#2563EB`（陪读蓝）
- 背景：深蓝渐变 `#1e3a5f` → `#2563EB`
- 图形：书本 + 陪伴光点，无文字
- 避免细线，小尺寸仍清晰
