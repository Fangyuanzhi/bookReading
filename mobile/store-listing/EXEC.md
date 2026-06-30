# M4c 本地执行说明

QQ 通道经 **cursor-api-proxy → Cursor CLI**，Shell 在 Cursor 沙箱内会被直接拒绝，与在 QQ 里说「给权限」无关。需要在 **本机终端** 或 **Cursor IDE 网页/桌面会话** 里跑命令。

## 一键生成

```bash
cd /home/fanghaitao/.openclaw/workspace/bookReading/mobile/store-listing
chmod +x run-m4c.sh
./run-m4c.sh              # 图标 + 截图（需 frontend dev 已起）
./run-m4c.sh --icons-only # 只生成图标（已有 icon-master.svg 即可）
```

## 分步执行

```bash
# 图标（支持 icon-master.svg）
cd assets/icons
npm install sharp --no-save
node generate-icons.mjs

# 截图（需 localhost:3000）
cd ../screenshots
npm install playwright sharp --no-save
npx playwright install chromium
node capture.mjs
```

## 若希望 QQ 里也能跑 Shell

1. 在 Cursor IDE 里直接对话（非 QQ 通道），或
2. 切到 Kimi：`/model Kimi`（直连 API，不经过 cursor-proxy），或
3. 在 OpenClaw 配置 `tools.exec` 审批策略后，用 Web 控制面批准 exec
