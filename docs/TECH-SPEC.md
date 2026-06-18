# 陪读 · 技术规约（Technical Spec）

> v0.1（MVP）
> 配套文档：产品需求 `PRD.md`、数据库 `supabase-schema.sql`

---

## 1. 架构总览：要不要拆前后端 + 数据存储？

**直接回答：逻辑上拆（表现层 / 业务逻辑 / 数据存储三层分离），物理上 MVP 阶段不拆成微服务。**

原因：Supabase 把「后端 + 数据库 + 认证 + 实时 + 对象存储」打包成一层托管服务，所以你只需要：

- **前端**：Next.js（React）单应用；
- **后端业务**：大部分逻辑由 Supabase（Postgres + RLS + Realtime + Auth + Storage）直接承担；少量「不能放客户端」的逻辑放 Next.js 服务端路由 / Edge Functions；
- **存储**：结构化数据（Postgres）+ EPUB/封面（对象存储）——本就天然分离。

**何时再物理拆分**（你熟 k8s，按需上）：EPUB 转换/解析、全文搜索、推荐这类重异步任务；在场/实时超出 Supabase 限额；或要把 Supabase 换成自托管 Postgres + 自有服务。
**原则**：现在就把边界（数据契约 / 接口）划清，以后能平滑抽服务，不用重写。

```
            [ 浏览器 · 响应式 Web（手机/平板/PC 一套 UI）]
                         │
        Next.js (React) 前端 —— 阅读器(foliate-js) / 氛围 / 社交层
                         │  Supabase JS Client（直连，受 RLS 约束）
                         ▼
   ┌──────────────── Supabase（托管后端层）────────────────┐
   │  Auth(账号)   Postgres(数据 + RLS)                      │
   │  Realtime(在场 / 实时段评)   Storage(EPUB / 封面)        │
   └────────────────────────────────────────────────────────┘
                         ▲
                         │  特权 / 重任务（不放客户端，用 service role）
        [ Next.js Route Handlers / Edge Functions ]
          —— EPUB 导入解析、内容审核、避风港下架、管理后台
        （未来按需抽到 k8s：EPUB 处理 / 搜索 / 推荐 等独立服务）
```

## 2. 前后端 + 存储职责划分

- **前端（Next.js / React）**：阅读器（foliate-js 渲染、选区 → CFI）、氛围 UI（暮/纸/夜、结伴/独自）、社交层（段评/书评/点亮）、订阅 Realtime、加入在场频道。直连 Supabase，越权由 RLS 兜底。
- **后端业务（Supabase 为主）**：Auth；Postgres CRUD（受 RLS）；Realtime（在场频道、段评订阅）；Storage（EPUB）。
- **轻服务端层（Next 服务端 / Edge Functions）**：EPUB 上传后解析章节写入 `chapters`；内容审核 & 避风港下架（特权操作，用 service role key）；管理后台；限频 / 反滥用。
- **数据存储**：Postgres（用户/书/章节/段评/书评/进度/小组）+ 对象存储（EPUB、封面、头像）。

## 3. 技术栈选型与理由

- **Next.js（React）**：面向公众要 SEO 与服务端能力；复用既有原型 UI。
- **foliate-js（MIT）**：EPUB 渲染内核，原生支持文本选区与 **CFI** 定位——段评锚定的关键；许可宽松，产品代码归你（避开 Readest 的 AGPL、Kavita 的 GPL）。
- **Supabase**：Postgres + Auth + Realtime + Storage 一站式；Realtime 直接解决在场与实时段评，省去自建 WebSocket。

## 4. 数据模型

详见 `supabase-schema.sql`。核心表：`profiles`、`books`、`chapters`、**`notes`（段评，含 `cfi`）**、`note_likes`、`reviews`、`review_likes`、`reading_progress`、`reading_groups` / `group_members`。

要点：

- `notes.cfi` = EPUB CFI 区间，把想法锚定到精确文字；`notes.text_quote` 存原文兜底。
- `chapters` 对应 EPUB spine，用于「每章在场」与章末书评。
- 全表 RLS 开启（策略见 schema）。

## 5. 关键技术方案（三个难点）

### 5.1 段评锚定（核心）
流程：foliate-js 取选区 → 生成 CFI 区间 → 连同 `text_quote`、`body` 写入 `notes` → 同章读者拉取该章 `notes` → 按 CFI 在原文渲染高亮/标记 → 点击展开想法。
鲁棒性：字号变化 / 重排不影响 CFI；若某条 CFI 解析失败，用 `text_quote` 做模糊回退定位并标记待修复。

### 5.2 实时在场（"N 人在读这一章"）
Supabase Realtime Presence，频道 `chapter:{chapter_id}`；客户端 `track { user_id, display_name, cursor_cfi }`；「N 人在读」= 频道当前成员数；**不落库**（临时状态）。进入 / 离开章节即 join / leave。

### 5.3 实时段评
Realtime 订阅 `notes` 表 insert（已加入 `supabase_realtime`），按 `chapter_id` 过滤，新想法实时插入对应段落；点亮订阅 `note_likes`。

### 5.4 内容管线
EPUB 上传至 Storage → 轻服务端解析 spine / TOC → 写 `books` / `chapters`；公版用批量脚本导入（Project Gutenberg / 古典）；UGC 走作者编辑 → 审核 → 发布；举报触发避风港下架（`status = 'removed'`）。

## 6. 安全与权限

- **RLS 全表开启**：公开想法人人可读、私人笔记仅本人、各表仅能改自己行（见 schema）。
- **特权操作**（导入 / 审核 / 下架）只在服务端用 service role key，绝不暴露给客户端。
- **Storage 桶权限**：公版封面 / EPUB 可公开读；授权内容用签名 URL / 鉴权。
- **反滥用**：发段评 / 书评限频；举报与封禁。

## 7. 许可与合规（商业化前必读）

- **软件**：foliate-js MIT，你的前后端可闭源、代码归己；对依赖做一次 license audit，保留 MIT/BSD 版权声明。
- **内容**：**公版（作者去世满 50 年 / Project Gutenberg）+ 原创 UGC** 起步；译本、点校本另有版权，别当公版；有钱后再加正版授权；**绝不托管盗版**。
- **平台责任**：落实「通知—删除」避风港，不「明知」放任侵权。
- 提醒：正式上线前，内容授权合同、用户协议、避风港流程请过 IP 律师（本文非法律意见）。

## 8. 部署与扩展路径

- **MVP**：前端 Vercel（或任意 Node 托管）+ Supabase 托管，一人即可运维。
- **扩展（按需）**：把 EPUB 解析/转换、全文搜索（Meilisearch / PG full-text）、推荐抽成独立服务上 k8s；在场/实时压力大时自建 Realtime 或换方案；Supabase 可平滑迁到自托管 Postgres。
- **原则**：MVP 即用清晰的数据契约与模块边界，保证未来抽服务不重写。

## 9. 模块 / 接口清单（MVP）

- **前端模块**：`Reader`（foliate-js 封装）、`AmbiancePanel`（主题/字号/结伴独自）、`NotesLayer`（段评锚定 + 面板）、`PresenceBar`（在场）、`ReviewList`（章末书评）、`Library`（书库/详情）、`Auth`。
- **服务端（Edge / Route）**：`POST 导入EPUB→解析章节`、`POST 举报/审核下架`、（后）`UGC 发布校验`。
- **Supabase 使用**：Auth、Postgres(RLS)、Realtime（presence + `notes`/`reviews` 订阅）、Storage（epub / cover / avatar）。

## 10. MVP 构建顺序（建议）

1. 跑 `supabase-schema.sql`、建 Storage 桶、配 Auth。
2. 导一本公版 EPUB，`Reader` 用 foliate-js 渲染通。
3. 选区 → CFI → 写 `notes`，拉取并按 CFI 渲染高亮，段评面板。
4. Realtime：在场频道 + 段评订阅。
5. 章末书评 + 点亮。
6. 氛围主题 + 结伴/独自，接上既有原型 UI。
7. 避风港下架 + 举报 + 基本限频。
