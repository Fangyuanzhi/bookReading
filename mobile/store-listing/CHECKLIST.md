# 上架提交流程清单

## 上线前准备

- [ ] 域名 + HTTPS 已配置
- [ ] `/privacy` 隐私政策页可公开访问
- [ ] `/legal` 合规说明页可公开访问
- [ ] 后端 API 生产环境稳定
- [ ] Capacitor 壳（M4a）已打包并可真机安装
- [ ] 推送证书 / 应用宝签名（M4b，若本期含推送）

## 素材生成

- [ ] 放置 master 图标：`assets/icons/icon-master.png`（1024×1024+）
- [ ] 运行 `node assets/icons/generate-icons.mjs`
- [ ] 启动 `npm run dev`（前端）+ 后端 API
- [ ] 运行 `node assets/screenshots/capture.mjs`
- [ ] 检查截图无测试数据、无 localhost 地址栏
- [ ] 应用宝宣传图：用 `assets/screenshots/promo-template.html` 导出 1080×540

## App Store Connect

- [ ] 创建 App，Bundle ID `com.peidu.reader`
- [ ] 上传构建（Xcode / Transporter）
- [ ] 应用图标 1024×1024
- [ ] iPhone 6.7" 截图 ≥3 张
- [ ] 填写中文本地化（`app-store/zh-CN/`）
- [ ] 填写英文本地化（`app-store/en-US/`）
- [ ] 隐私政策 URL
- [ ] App 隐私问卷（见下方数据收集说明）
- [ ] 年龄分级问卷 → 4+
- [ ] 审核备注：提供测试账号（见 `app-store/review-notes.txt`）
- [ ] 提交审核

## 腾讯应用宝

- [ ] 注册开发者账号（企业或个人）
- [ ] 创建应用，包名 `com.peidu.reader`
- [ ] 上传 APK / AAB
- [ ] 应用图标 512×512
- [ ] 截图 ≥3 张（1080×1920）
- [ ] 宣传图 1080×540
- [ ] 填写应用介绍（`yingyongbao/description.txt`）
- [ ] 隐私政策 URL（同 App Store）
- [ ] 软件著作权（企业上架通常需要，提前 1–2 月申请）
- [ ] 提交审核

## App 隐私问卷参考（Apple）

陪读收集的数据（如实申报）：

| 数据类型 | 是否收集 | 用途 | 是否关联用户 |
|----------|----------|------|--------------|
| 联系信息（邮箱） | 是 | 账号注册 | 是 |
| 用户内容（段评、笔记） | 是 | 核心功能 | 是 |
| 标识符（用户 ID） | 是 | 账号体系 | 是 |
| 使用数据（阅读进度） | 是 | 继续阅读 | 是 |
| 诊断数据（崩溃日志） | 可选 | 稳定性 | 否 |

不收集：精确位置、健康、财务（支付走第三方时不经手卡号）。

## 审核常见拒因与预防

| 拒因 | 预防 |
|------|------|
| 隐私政策缺失 / 链接失效 | 上线前 curl 检查 `/privacy` |
| 登录才能用但无测试账号 | 在审核备注提供 demo 账号 |
| 用户生成内容无举报入口 | 阅读器 / 详情页已有举报按钮 |
| 截图与实机不符 | 用 capture 脚本从真实 UI 抓取 |
| 占位 / 测试文案 | 截图前清空 mock 支付等测试 UI |
