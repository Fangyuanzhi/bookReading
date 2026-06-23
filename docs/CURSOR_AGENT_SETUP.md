# Cursor Agent 模式配置指南

## 背景

本项目前端开发需要在 Cursor 模型（cursor/auto）下让 AI 能直接修改代码文件。默认情况下 cursor-api-proxy 运行在 `ask` 模式（只读问答），需要改为 `agent` 模式。

## 配置步骤

### 1. 修改环境变量文件

编辑 `~/.openclaw/cursor.env`：

```bash
# 本地 Cursor OpenAI 兼容代理端口
CURSOR_PROXY_PORT=8765

# Cursor CLI 模式：ask（只读问答）或 agent（允许写代码）
CURSOR_BRIDGE_MODE=agent

# 工作区配置
CURSOR_BRIDGE_WORKSPACE=/home/fanghaitao/.openclaw/workspace
CURSOR_BRIDGE_CHAT_ONLY_WORKSPACE=false
```

### 2. 修改启动脚本

编辑 `~/start-cursor-proxy.sh`，在启动前添加环境变量导出（约第 55 行附近）：

```bash
export CURSOR_BRIDGE_PORT="$PORT"
export CURSOR_BRIDGE_ACP_SKIP_AUTHENTICATE=true
export CURSOR_BRIDGE_MODE="${CURSOR_BRIDGE_MODE:-agent}"
export CURSOR_BRIDGE_WORKSPACE="${CURSOR_BRIDGE_WORKSPACE:-/home/fanghaitao/.openclaw/workspace}"
export CURSOR_BRIDGE_CHAT_ONLY_WORKSPACE="${CURSOR_BRIDGE_CHAT_ONLY_WORKSPACE:-false}"

nohup env \
  CURSOR_AUTH_TOKEN="$CURSOR_AUTH_TOKEN" \
  CURSOR_BRIDGE_PORT="$PORT" \
  CURSOR_BRIDGE_ACP_SKIP_AUTHENTICATE=true \
  CURSOR_BRIDGE_MODE="$CURSOR_BRIDGE_MODE" \
  CURSOR_BRIDGE_WORKSPACE="$CURSOR_BRIDGE_WORKSPACE" \
  CURSOR_BRIDGE_CHAT_ONLY_WORKSPACE="$CURSOR_BRIDGE_CHAT_ONLY_WORKSPACE" \
  cursor-api-proxy >> /tmp/cursor-proxy.log 2>&1 &
```

### 3. 重启服务

```bash
~/start-cursor-proxy.sh
```

### 4. 验证配置

```bash
tail -20 /tmp/cursor-proxy.log
```

预期输出：
```
cursor-api-proxy listening on http://127.0.0.1:8765
- mode: agent
- workspace: /home/fanghaitao/.openclaw/workspace
- chat-only workspace: no
```

关键检查点：
- `mode: agent`（不是 `ask`）
- `chat-only workspace: no`（不是 `yes`）

## 使用

配置完成后，在 QQ 对话中：

1. 切换到 Cursor 模型：
   ```
   /model Auto
   ```

2. 让 AI 写代码：
   ```
   开始方案 B，继续开发 Reader 的段评功能
   ```

## 故障排查

### Cursor 无响应

1. 检查 proxy 是否运行：
   ```bash
   curl http://127.0.0.1:8765/health
   ```

2. 检查 Cursor CLI 状态：
   ```bash
   agent --list-models
   ```

3. 重新登录 Cursor：
   ```bash
   NO_OPEN_BROWSER=1 agent login
   # 复制链接到 Windows 浏览器完成登录
   ```

4. 查看详细日志：
   ```bash
   tail -100 /tmp/cursor-proxy.log
   ```

### 问题：spawn E2BIG 错误

**现象**：Cursor 模型无响应，日志显示 `Agent stream error: Error: spawn E2BIG`

**原因**：cursor-api-proxy 通过命令行参数传递大量上下文给 `agent` 进程，超过系统限制（Linux `ARG_MAX` 通常为 2MB，但实际可能更小）。

**解决**：
1. 限制上下文长度（可能缓解）：
   ```bash
   # ~/.openclaw/cursor.env
   CURSOR_BRIDGE_MAX_CONTEXT_LENGTH=8000
   ```

2. **推荐：切换到 Kimi 模型**（根治）：
   ```
   /model Kimi
   ```
   Kimi 直连 Moonshot API，不经过 cursor-api-proxy，无此问题。

### 备用方案：使用 Kimi

如果 Cursor 实在无法使用，切换到 Kimi 模型：

```
/model Kimi
```

Kimi 直连 Moonshot API，不经过 cursor-api-proxy，可以正常写代码。

## 相关文件

- `~/.openclaw/cursor.env` - 环境变量配置
- `~/start-cursor-proxy.sh` - 启动脚本
- `/tmp/cursor-proxy.log` - 运行日志
- `~/.config/cursor/auth.json` - Cursor 登录凭证
