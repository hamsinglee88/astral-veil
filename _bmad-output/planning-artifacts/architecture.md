---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
workflowType: architecture
status: complete
completedAt: '2026-04-04'
lastStep: 8
project_name: astral-veil
user_name: Hamsing
document_language: zh-CN
prd_reference_version: '1.2'
---

# 架构决策文档 — **astral-veil**（星聊）

**作者（工作流）：** Hamsing  
**日期：** 2026-04-04  
**输入：** 产品需求文档 `prd.md` v1.2（中文）、现有 React/Vite 代码库、PRD §14 中 ASP.NET Core API 约定。

---

## 1. 摘要

**星聊（astral-veil）** 是一款 **移动优先的单页应用（SPA）**（React + Vite），生产环境计划采用 **ASP.NET Core** 作为后端，对外提供 **REST API**，首期与 PRD 对齐的接口为 **`POST /api/horoscope`**。当前仓库为 **棕地**：浏览器端、开发期 Node 运势中间件、以及仅本地的能力（档案、匹配队列演示、树洞会话 UI）均已存在。

本文档记录 **架构决策**、**实现一致性规则** 与 **推荐仓库目录结构**，使实现方（人或 AI）在 **技术栈、边界与 API 契约** 上保持一致。

---

## 2. 项目上下文分析

### 2.1 需求概览（来自 PRD）

| 领域 | 架构含义 |
|------|----------|
| **FR — 身份** | 手机号 + 验证码交互；当前持久化在 **客户端**；上线需 **服务端鉴权** + **会话 / JWT**。 |
| **FR — 运势** | **结构化 JSON** 运势；通过 **OpenAI 兼容** Chat Completions 调用 AI；不可用时有 **兜底**。 |
| **FR — 树洞** | **群聊** 语义；MVP 为会话级本地；增长阶段 → **房间 + 消息 API** + 可选 **SignalR**。 |
| **FR — 匹配** | **队列 + 随机配对**；MVP 使用 **BroadcastChannel + localStorage**；增长阶段 → **服务端队列**。 |
| **NFR — 性能** | PRD NFR3：**90%** 用户在 **45 秒**内看到有效运势；客户端超时 **30 秒**；超时或 5xx 走兜底。 |
| **NFR — 安全** | 前端构建产物中 **不得** 包含 AI 密钥；密钥仅保存在服务端。 |
| **NFR — Web** | NFR6：Chrome / Safari / Edge / Firefox **最近两个大版本**；主路径可 **键盘** 完成；WCAG 2.1 AA 为 **增强目标**。 |

### 2.2 规模与复杂度

- **复杂度：** **中等** — 第三方 AI、手机号（PII）、UGC 风险、跨标签页演示语义。
- **主域：** **全栈 Web** — SPA + HTTP API，后续可选实时能力。
- **横切关注点：** 鉴权演进、内容安全（AI + UGC）、可观测性、公开接口 **限流**。

### 2.3 技术约束（由 PRD / 产品锁定）

- **前端栈** 已选定：React 19、Vite 6、Tailwind v4（见仓库）。
- **后端目标：** **ASP.NET Core**、**.NET 8 LTS**（支持策略见 [Microsoft .NET 支持策略](https://dotnet.microsoft.com/platform/support/policy)；宜在 .NET 8 支持结束前规划迁移至 **.NET 10 LTS** 等后续 LTS）。
- **AI：** OpenAI 兼容 HTTP API；产品路径 **不** 使用 Google GenAI SDK。

---

## 3. 起步模板评估（棕地）

### 3.1 主技术域

- **前端：** 已初始化为 **Vite + React + TypeScript** SPA — **不再** 换脚手架；延续现有模式。
- **后端（新增）：** **ASP.NET Core Web API** 模板（`dotnet new webapi`）或 **Minimal API** + OpenAPI — 由团队选择；默认建议端点增多时采用 **Web API + 控制器** 以边界清晰。

### 3.2 选定方案

| 层次 | 决策 |
|------|------|
| **SPA** | **保留** 当前 Vite 工程；开发环境在 `vite.config.ts` 中为 .NET API 配置 **代理**。 |
| **API** | 在仓库中 **新建** .NET 项目（建议目录：`server/AstralVeil.Api/` 或 `backend/AstralVeil.Api/`）。 |
| **数据库（增长期）** | 关系型数据建议 **PostgreSQL**（会话 / 档案 / 消息）；具体在「持久化」Epic 再定；若有替代方案须 **文档化**。 |

**后端骨架初始化命令（创建工程时）：**

```bash
dotnet new webapi -n AstralVeil.Api -o server/AstralVeil.Api --use-controllers
```

*（具体路径以团队规范为准。）*

---

## 4. 核心架构决策

### 4.1 数据架构

| 决策项 | 选择 | 说明 |
|--------|------|------|
| **MVP 持久化** | 浏览器 **localStorage** / **sessionStorage**（与现状一致） | 符合 PRD MVP。 |
| **生产持久化** | **PostgreSQL** + EF Core（推荐） | 迁移脚本；PII 静态加密等需安全评审后定稿。 |
| **缓存** | 后续可选 **Redis**（会话 / 限流） | MVP API 非必需。 |

### 4.2 认证与安全

| 决策项 | 选择 | 说明 |
|--------|------|------|
| **MVP API** | **运势** 可保持 **匿名**，或 **可选** API Key / IP **限流** | PRD 允许 SPA 无鉴权调用运势；仍应对 `POST /api/horoscope` **限流**。 |
| **增长期** | **OTP 校验** 后签发 **JWT（Bearer）** 或 **Cookie 会话** | 令牌由 `/api/auth/*` 一类接口颁发。 |
| **密钥** | **User Secrets** / 环境变量 / 密钥托管 存放 `OPENAI_API_KEY` | **禁止** 提交到仓库。 |

### 4.3 API 与通信

| 决策项 | 选择 | 说明 |
|--------|------|------|
| **风格** | **REST + JSON**（JSON 属性 **camelCase**） | 与 PRD §14 及现有前端 `fetch` 一致。 |
| **文档** | **OpenAPI 3**（Swashbuckle 或 NSwag） | 供人与智能体消费。 |
| **错误** | 稳定 **`error` 码**（如 `NO_API_KEY`、`AI_UPSTREAM` …） | 与 PRD §14.3 及前端处理对齐。 |
| **实时（未来）** | **SignalR**（匹配 / 聊天） | 待持久化与鉴权就绪后再做。 |

### 4.4 前端架构

| 决策项 | 选择 | 说明 |
|--------|------|------|
| **状态** | **React `useState` / Context**（当前） | MVP 足够；全局状态膨胀再考虑 **Zustand** 等。 |
| **API 基址** | 可选 **`VITE_API_BASE_URL`**；默认 **相对路径 `/api`** | 生产环境同源或反向代理。 |
| **运势客户端** | 单一模块（`fetchHoroscope`） | 实现时须遵守 **30 秒** 超时 / 中止。 |

### 4.5 基础设施与部署

| 决策项 | 选择 | 说明 |
|--------|------|------|
| **SPA** | 静态托管（CDN、对象存储或 nginx） | `npm run build` → `dist/`。 |
| **API** | **Kestrel** 置于反向代理后（nginx、YARP 或云负载均衡） | TLS 在边缘终止。 |
| **CI** | 构建 **SPA** + **`dotnet publish`**；执行 **lint + 单元测试** | 不按 BMAD 要求做时间估算。 |

---

## 5. 实现模式与一致性规则

以下规则用于让 **多个实现代理** 输出可兼容的代码。

### 5.1 命名与格式

| 主题 | 规则 |
|------|------|
| **JSON** | API 与客户端均使用 **`camelCase`** 属性名。 |
| **日期** | 运势请求中 `dateISO` 使用 **ISO 8601** 日期串 `YYYY-MM-DD`。 |
| **HTTP** | 运势使用 **POST**；成功 **200**，正文 `{ "horoscope": { ... } }`。 |

### 5.2 错误处理

- **503** + `{ "error": "NO_API_KEY" }`：未配置 AI 时（前端按 PRD 走兜底）。
- **4xx/5xx**：使用稳定 **`error`** 字符串；可选 **`detail`** 供运维，**勿** 原样暴露给最终用户。

### 5.3 日志（.NET）

- 使用 **`ILogger<T>`**；记录上游 AI 失败时带 **状态码** 与 **截断** 响应体；**绝不** 记录 API 密钥。

### 5.4 前端加载与 NFR3

- 进入运势页立即展示 **加载中**。
- 使用 **`AbortController`** 或与 **30 秒** 客户端超时一致的 fetch 超时；失败时走与 503 **相同** 的兜底路径。

---

## 6. 项目结构与边界

### 6.1 逻辑模块 ↔ PRD

| PRD 领域 | 主要归属 |
|----------|----------|
| 运势 | `HoroscopeController` 或最小路由 + **AI 编排服务** |
| 认证（未来） | `Auth` 功能文件夹 + OTP 提供商抽象 |
| 档案（未来） | `Users` / `Profiles` |
| 房间 / 聊天（未来） | `Rooms`、`Messages`；可选 **SignalR** Hub |
| 匹配（未来） | `MatchQueue` 服务 |

### 6.2 仓库目录（推荐）

```text
astral-veil/
├── src/                      # 现有 Vite React SPA
├── server/
│   └── AstralVeil.Api/       # 新建：ASP.NET Core Web API（建议）
│       ├── Controllers/
│       ├── Services/         # 运势 AI 编排
│       ├── Models/Dtos/
│       └── Program.cs
├── public/                   # 静态资源
├── _bmad-output/
│   └── planning-artifacts/
│       ├── prd.md
│       └── architecture.md   # 本文档
└── package.json
```

**边界：**

- **SPA** **不得** 内嵌密钥；仅通过 **`VITE_*`** 读取 **非机密** 配置。
- **API** 负责 **OpenAI** 调用与 **限流**。

### 6.3 FR → 组件映射（摘要）

| FR 编号 | 层次 |
|---------|------|
| FR-H* | API **运势** + SPA **运势页** |
| FR-A* | SPA **登录/建档**；未来 **认证 API** |
| FR-T* | SPA **树洞**；未来 **房间 API** + 数据库 |
| FR-M* | SPA **匹配** 演示；未来 **匹配 API** |
| FR-N* | SPA **壳**（导航、标题） |

---

## 7. 架构验证（自检）

| 检查项 | 结果 |
|--------|------|
| **决策相容性** | React SPA + .NET API 为常见组合；开发环境配置 **CORS**。 |
| **PRD 契约** | §14.3 `POST /api/horoscope` 请求/响应已文档化；与 `fetchHoroscope` 一致。 |
| **NFR 覆盖** | NFR3 → 超时与兜底；NFR2 → 密钥在服务端；NFR6 → 浏览器矩阵供测试对齐。 |
| **缺口** | **持久化**、**鉴权**、**内容治理** 按 PRD 增长阶段 **有意延后**。 |

**验证结论：** 在明确 **延后项** 的前提下，**可进入实现**。

---

## 8. 完成与交接

### 8.1 交付物

- 与 **PRD v1.2** 对齐的 **架构决策文档**（本文）。
- 明确划分：**当前 SPA + 开发中间件** vs **目标 .NET API**。

### 8.2 建议后续步骤

1. 搭建 **`AstralVeil.Api`** 骨架，按 PRD §14 实现 **`POST /api/horoscope`**（与 `server/horoscope-api-plugin.ts` 行为对等）。
2. 配置 Vite 开发 **代理**：`/api` → `https://localhost:{dotnet 端口}`。
3. 后端排期确定后，运行 **`bmad-check-implementation-readiness`** 或进行 **Epic/Story** 拆分。
4. 其他 BMAD 流程可调用 **`bmad-help`**。

---

## 9. 参考资料

- 产品需求：`_bmad-output/planning-artifacts/prd.md` v1.2  
- .NET 支持周期：[https://dotnet.microsoft.com/platform/support/policy](https://dotnet.microsoft.com/platform/support/policy)  
- OpenAI 兼容 Chat HTTP：[https://platform.openai.com/docs/api-reference/chat](https://platform.openai.com/docs/api-reference/chat)（通用 HTTP 集成模式）

---

*架构决策文档结束 — astral-veil*
