---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
  - step-12-complete
inputDocuments: []
documentCounts:
  briefCount: 0
  researchCount: 0
  brainstormingCount: 0
  projectDocsCount: 0
workflowType: prd
document_language: zh-CN
workflowNote: >-
  基于 astral-veil 代码库与已对齐的产品方向整理（移动优先 Web、手机号登录、AI 运势、
  树洞群聊、随机匹配队列）。按干系人要求将交互式 BMAD 多轮引导合并为本文档。
  v1.1：增补后端 API 开发说明，目标技术栈为 ASP.NET Core（.NET）。
  v1.2：依据校验报告（bmad-validate-prd）修订——追溯矩阵、可量化 NFR、创新点、旅程示例、阶段展望。
classification:
  projectType: web_app
  projectTypeSignals: SPA、React、Vite、浏览器优先、响应式布局
  domain: general
  domainNotes: >-
    消费生活方式 / 星座社交；默认非强监管行业。仍需重视内容与隐私（手机号、群聊 UGC）。
  complexity: medium
  projectContext: brownfield
  complexityRationale: >-
    第三方 AI、登录与身份预期、UGC 治理、跨标签页协同等，使工程与合规面高于简单 CRUD。
backend_stack:
  framework: ASP.NET Core
  runtime: ".NET 8+（LTS）"
  api_style: Web API（JSON）；建议 OpenAPI（Swashbuckle / NSwag）
---

# 产品需求文档（PRD）— 星聊（astral-veil）

**作者：** Hamsing  
**日期：** 2026-04-04  
**版本：** 1.2

---

## 1. 摘要

**星聊** 是一款 **移动优先** 的 **Web 应用**，整合 **每日运势**（依据用户 **公历生日** 与 **西方星座**）、**匿名群聊**（「树洞」）以及 **无需实名** 的 **随机陌生人匹配**。产品强调 **神秘、低摩擦** 的体验：手机号登录、在配置好 API 时由 AI 生成运势文案，并以轻量社交承载「宇宙身份」叙事。

当前代码库为 **棕地（brownfield）**：React 19 + Vite 6 + Tailwind v4；运势通过 **开发环境** 下 OpenAI 兼容的 HTTP 接口生成；档案与匹配队列实验依赖 **客户端持久化**。

---

## 2. 产品愿景与目标

### 2.1 愿景

为用户提供 **安静、匿名** 的空间：阅读 **个性化每日指引**，在 **群聊房间** 里说话，并偶尔通过 **公平随机队列** **遇见另一个灵魂**——不必承担真实身份负担。

### 2.2 目标

| 目标 | 说明 |
|------|------|
| G1 | 用户可使用 **中国大陆手机号** 登录（产品方向；MVP 后端 **尚未** 接入短信服务商）。 |
| G2 | **每日运势** 体现 **生日 + 星座**；在配置 API 密钥时由 **AI 生成**，否则使用 **确定性兜底** 文案。 |
| G3 | **树洞** 在 MVP 中定位为 **群聊**，而非一对一私聊。 |
| G4 | **匹配** 将点击匹配的用户放入 **队列**，在有两名参与者时 **随机配对**；**不要求实名**。 |
| G5 | 保持 **品牌与体验一致**（深色宇宙风、玻璃/星云视觉、中文为主文案）。 |

### 2.3 非目标（当前范围）

- 完整 **短信 OTP** 服务商对接与 **服务端会话**（前端可先做格式校验）。
- UGC 的 **审核、举报、司法保全** 流水线（规模上线前须补规划）。
- **原生 App**（仅 Web；日后可评估响应式 / PWA）。

### 2.4 创新点与差异化

| 维度 | 说明 |
|------|------|
| **内容** | 运势由 **生日 + 星座 + 当日** 驱动，AI 生成结构化 JSON，失败时 **确定性兜底**，避免“白屏”。 |
| **社交** | **树洞 = 群聊**（共享场域），匹配 **队列 + 随机**，**不要求实名**，降低心理门槛。 |
| **工程** | 棕地 **React SPA** 与目标 **ASP.NET Core** API **契约先行**（§14），便于前后端独立演进。 |

---

## 3. 目标用户与画像

| 画像 | 需求 | 行为 |
|------|------|------|
| **观星者 Sam** | 每日情绪锚点、可分享文案 | 早间打开、浏览运势、可能分享 |
| **夜猫子 Nia** | 匿名倾诉、同类共鸣 | 深夜使用树洞群聊 |
| **寻觅者 Sui** | 低负担连接 | 好奇时使用匹配队列；不要求实名 |

---

## 4. 项目分类（发现阶段）

- **类型：** `web_app` — 浏览器 SPA，响应式，移动优先导航。
- **领域：** `general` 消费生活方式 / 星座社交；因 AI、手机号（PII）与 UGC，复杂度为 **中等**。
- **上下文：** **棕地** — 已有界面流、状态与 API 雏形；本 PRD 用于对齐实现与产品意图。

---

## 5. 成功标准

| ID | 标准 | 衡量方式 |
|----|------|----------|
| SC1 | 用户 **无错误** 完成 **登录 → 建档 → 首次运势** | 测试 / 埋点任务完成率 |
| SC2 | 运势数据结构符合 **约定字段**（启示、幸运项、维度等） | API 契约 + UI 快照测试 |
| SC3 | 群聊能 **发送并展示** 本会话内新消息 | E2E 或手工测试 |
| SC4 | 两个客户端 **同时进队** 时可完成 **匹配** | 双标签 / 双浏览器手工测试 |
| SC5 | 不依赖 **Google GenAI SDK**；AI 仅经 **OpenAI 兼容** 服务端路由 | 依赖审计 |

---

## 6. 核心用户旅程（摘要）

1. **建档：** 输入手机号 + 验证码 → 昵称 + 出生年月日 → 推算星座 → 进入 **运势**。
2. **每日运势：** 加载个性化运势；可选分享 / 复制。
3. **树洞：** 进入 **群组** 房间，浏览线程，发送匿名消息。
4. **匹配：** 点击 **开始匹配** → 等待 → **配对** 后展示随机对象卡片（演示用资料）。
5. **我的：** 查看昵称、星座、统计、设置占位；**注销** 清除本地档案。

### 6.1 旅程示例：每日运势（展开）

| 步骤 | 用户动作 | 系统响应 | 对应 FR |
|------|-----------|-----------|---------|
| 1 | 打开 App，已建档 | 展示运势 Tab | FR-N1 |
| 2 | 进入运势页 | 请求当日运势（见 FR-H2） | FR-H2、FR-H3 |
| 3 | 等待 | 加载态；成功则渲染结构化字段 | FR-H4、NFR3 |
| 4 | 失败或超时 | 展示兜底运势 | FR-H3 |
| 5 | 点击分享 | 调用系统分享或复制 | （非核心 FR，可后续单列） |

---

## 7. 功能需求

能力描述 **可测试**、**与实现方式无关**。ID 固定便于追溯。

### 7.1 身份与会话

| ID | 需求 |
|----|------|
| FR-A1 | 系统应允许用户输入 **中国大陆手机号**（11 位）与 **6 位验证码** 后再进入后续流程。 |
| FR-A2 | 系统应在 **客户端存储** 中 **持久化** 已登录用户档案（至少：手机号、昵称、出生 **年/月/日**、**星座**），以便再次访问。 |
| FR-A3 | 用户应能 **注销**，清除当前设备/浏览器上的持久化档案数据。 |

### 7.2 运势

| ID | 需求 |
|----|------|
| FR-H1 | 系统应根据出生 **月、日** 计算 **西方星座**。 |
| FR-H2 | 系统应使用 **出生日期**、**星座中文名**、**日历日期** 向服务端请求 **当日运势内容**。 |
| FR-H3 | 当 AI 不可用时，系统应展示 **兜底** 运势，保证界面可用。 |
| FR-H4 | 运势应包含 **今日启示**、**幸运色**（名称 + 十六进制）、**幸运数字**、**幸运物品**，以及 **恋爱 / 事业 / 能量** 三个维度的 **星级 + 短句**。 |

### 7.3 树洞（群聊）

| ID | 需求 |
|----|------|
| FR-T1 | 产品应将 **树洞** 呈现为 **群聊**（共享房间），MVP 阶段 **不是** 一对一私聊。 |
| FR-T2 | 用户应能 **浏览可滚动消息列表**，并 **发送文本消息**，且在本会话内可见。 |
| FR-T3 | 分类筛选可 **过滤或限定** 展示消息（具体策略可迭代；不得破坏发送/浏览）。 |

### 7.4 匹配

| ID | 需求 |
|----|------|
| FR-M1 | 用户应通过明确操作（**开始匹配**）**进入匹配队列**。 |
| FR-M2 | 当队列中 **至少两人** 时，系统应 **配对两人** 并将其移出队列。 |
| FR-M3 | 配对应在符合条件的队列成员间 **随机** 进行。 |
| FR-M4 | **实名认证** **不是** 匹配的必要条件。 |
| FR-M5 | 配对后用户应看到 **匹配结果**（例如对方卡片）。 |

### 7.5 导航与壳

| ID | 需求 |
|----|------|
| FR-N1 | 对已登录用户，应用应提供底部导航：**运势 / 树洞 / 匹配 / 我的**。 |
| FR-N2 | 壳层标题应与品牌一致（**星聊**）。 |

### 7.6 需求追溯矩阵（目标 / 旅程 → FR）

| 目标 ID | 主要覆盖 FR |
|---------|-------------|
| G1 | FR-A1、FR-A2 |
| G2 | FR-H1～FR-H4 |
| G3 | FR-T1 |
| G4 | FR-M1～FR-M5 |
| G5 | FR-N2、NFR5 |

| 旅程（§6 编号） | 主要覆盖 FR |
|-----------------|-------------|
| 1 建档 | FR-A1、FR-A2、FR-H1 |
| 2 每日运势 | FR-H2～FR-H4 |
| 3 树洞 | FR-T1～FR-T3 |
| 4 匹配 | FR-M1～FR-M5 |
| 5 我的 | FR-A3、FR-N1 |

---

## 8. 非功能需求

| ID | 类别 | 需求 |
|----|------|------|
| NFR1 | 隐私 | 建档摘要中 **不得** 完整展示手机号（应 **掩码** 中间位）。 |
| NFR2 | 安全 | AI 的 **API 密钥** 不得打入前端包；仅 **服务端** 或 **开发中间件**。 |
| NFR3 | 性能 | **运势首屏：** 自进入运势页起，在典型网络下 **90%** 用户应在 **45 秒内** 看到有效运势内容（成功响应 **或** 兜底文案）；**不得** 无限转圈。 **接口：** 单次 `POST /api/horoscope` 客户端超时建议 **30 秒**；超时或 **5xx** 必须走兜底（与 FR-H3 一致）。 |
| NFR4 | 可维护性 | 运势请求/响应应遵循 **已文档化的 JSON 结构**，前后端一致。 |
| NFR5 | 本地化 | **产品界面主语言为中文**；代码与部分工程文档可为英文。 |
| NFR6 | Web 兼容性 | 支持 **近两代** 主流浏览器（Chrome / Safari / Edge / Firefox 的 **最新两个大版本**）。**可访问性：** WCAG **2.1 AA** 为 **增强目标**；MVP 须保证 **主路径（登录→建档→运势→底部导航）** 可 **键盘操作** 完成。 |

---

## 9. 技术约束（棕地）

- **前端：** React 19、Vite 6、Tailwind CSS v4、Motion、Lucide。
- **AI（开发期）：** Vite 中间件提供 OpenAI 兼容 **`POST /api/horoscope`**；`.env.local` 配置 `OPENAI_API_KEY`（可选 `OPENAI_BASE_URL`、`OPENAI_MODEL`）。
- **后端（目标）：** **ASP.NET Core** Web API 承载同一套 REST 契约；生产环境由 .NET 服务托管运势与后续领域 API（见 **§14**）。
- **资源：** 静态图放在 `public/assets/images/`（生产路径避免外链占位图）。
- **字体：** `@fontsource` 打包（核心字体不依赖 Google Fonts CDN）。

---

## 10. 范围与发布

### MVP（当前方向）

- 手机号 + 验证码 **界面**；本地档案持久化。
- 星座推算 + 运势 **AI 或兜底**。
- 树洞 **群聊** 体验，消息 **会话级**（种子数据 + 用户发送）。
- 匹配 **队列** + **随机配对**（BroadcastChannel + `localStorage` 演示）。

### 增长期（Growth）

- 服务端 **会话**、档案 **云同步**；树洞消息 **持久化** 与 **基础审核**。
- 匹配队列 **服务端化**（多设备公平性）。

### 愿景期（Vision）

- **PWA** 或 **小程序** 触达；运营活动与 **话题房间**；可选 **付费会员**（若与法务/支付合规对齐后）。

### 后续（与 MVP 衔接）

- 真实 **短信** 与 **服务端鉴权**。
- **聊天** 持久化后端与 **内容治理**。
- 纯静态部署时 **生产环境** 托管 `/api/horoscope`。

---

## 11. 风险与开放问题

| 风险 / 问题 | 缓解思路 |
|-------------|----------|
| 群聊 UGC 滥用 | 后续：举报、频控、关键词、运营工具 |
| AI 内容安全 | 系统提示约束、服务端校验、用户免责声明 |
| 匹配公平性 | 厘清 **先进先出 vs 随机** 边界；多设备身份 |
| 手机号等 PII 而无完整后端 | 现阶段视为 **原型**；上线前补隐私政策与数据处理协议 |

---

## 12. 术语表

- **星聊 / 星语秘境：** 界面产品名；仓库 id 为 `astral-veil`。
- **树洞：** 匿名群聊房间。
- **匹配队列：** 随机配对前的等待队列。
- **ASP.NET Core：** 微软跨平台 Web 框架；本 PRD 约定生产后端采用 **.NET** 实现 REST API（与前端 JSON 契约一致）。

---

## 13. 评审与后续

- **建议后续工作流：** `bmad-validate-prd`、`bmad-check-implementation-readiness`，再进入架构 / Epic。
- **干系人确认：** 产品负责人确认短信范围、内容治理与数据埋点后再公开发布。

---

## 14. 后端 API 开发文档（ASP.NET Core）

> 本节约定 **星聊** 服务端 REST API 的契约与实现导向，技术栈为 **ASP.NET Core**（建议 **.NET 8 LTS** 或更新 LTS）。当前仓库中运势接口由 **Node/Vite 开发中间件** 实现；**生产环境**应迁移至 **.NET 项目**，保持 **路径、请求体、响应体** 与下表一致，便于前端 `fetch` 与代理配置不变或仅改 `base URL`。

### 14.1 技术选型与工程约定

| 项 | 建议 |
|----|------|
| 项目模板 | `ASP.NET Core Web API`（无控制器可使用 Minimal APIs；团队偏好可改为 Controller） |
| 序列化 | `System.Text.Json`，属性名 **camelCase**（与前端 JSON 一致） |
| 文档 | OpenAPI 3（Swashbuckle.AspNetCore 或 NSwag），开发环境暴露 `/swagger` |
| 配置与密钥 | `appsettings.json` + 环境变量；**OpenAI/API 密钥** 使用 User Secrets（本地）或密钥托管（生产），**禁止** 提交到仓库 |
| 跨域 | 为 SPA 配置 `CorsPolicy`，允许前端源（如 `https://app.example.com`）与 `Authorization`、`Content-Type` 头 |
| 日志 | `ILogger<T>`，对 AI 上游错误记录 **状态码与截断后的响应**，勿记录完整密钥 |
| 健康检查 | `GET /health` 或 `/alive`，供负载均衡探测（可选） |

### 14.2 通用约定

| 项 | 约定 |
|----|------|
| 基础路径 | 所有 API 建议前缀 **`/api`**；后续可引入 **`/api/v1`** 版本化（首版可与 `/api` 并存） |
| 请求体 | `Content-Type: application/json; charset=utf-8` |
| 成功响应 | HTTP **200** / **201**，正文为 JSON 对象 |
| 错误响应 | 建议统一结构：`{ "error": "CODE", "message": "人类可读说明", "detail": "可选，技术细节" }`（与现有运势错误码对齐时可扩展） |

### 14.3 运势（已实现契约，与前端对齐）

#### `POST /api/horoscope`

根据用户 **公历生日**、**星座中文名**、**当日日期** 生成结构化运势（服务端调用 OpenAI 兼容 **Chat Completions**，`response_format: json_object`，提示词约束字段与前端 `HoroscopePayload` 一致）。

**请求体（JSON）**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `birthYear` | `number` | 是 | 出生年 |
| `birthMonth` | `number` | 是 | 出生月 1–12 |
| `birthDay` | `number` | 是 | 出生日 |
| `zodiacLabel` | `string` | 是 | 星座中文名，如 `"天蝎座"` |
| `dateISO` | `string` | 否 | 运势日期 `YYYY-MM-DD`，默认服务端当日 |

**成功响应 `200`**

```json
{
  "horoscope": {
    "moonNote": "string",
    "insight": "string",
    "luckyColorName": "string",
    "luckyColorHex": "#RRGGBB",
    "luckyNumber": "string",
    "luckyItem": "string",
    "dimensions": {
      "love": { "rating": 1, "text": "string" },
      "career": { "rating": 1, "text": "string" },
      "energy": { "rating": 1, "text": "string" }
    }
  }
}
```

`rating` 为整数 **1–5**。

**错误响应**

| HTTP | `error`（示例） | 说明 |
|------|-----------------|------|
| 400 | 缺少参数 | `birthYear` / `birthMonth` / `birthDay` / `zodiacLabel` 缺失 |
| 503 | `NO_API_KEY` | 服务端未配置 AI 密钥；前端可降级为本地兜底 |
| 502 | `AI_UPSTREAM` | 上游模型 API 非 2xx |
| 502 | `EMPTY_AI_RESPONSE` | 模型返回无内容 |
| 500 | `HOROSCOPE_FAILED` | 解析或内部异常 |

**C# 请求/响应模型（摘录）**

```csharp
public sealed record HoroscopeRequest(
    int BirthYear,
    int BirthMonth,
    int BirthDay,
    string ZodiacLabel,
    string? DateISO
);

public sealed record HoroscopeResponse(HoroscopePayload Horoscope);

public sealed record HoroscopePayload(
    string MoonNote,
    string Insight,
    string LuckyColorName,
    string LuckyColorHex,
    string LuckyNumber,
    string LuckyItem,
    DimensionBlock Dimensions
);

public sealed record DimensionBlock(
    DimensionItem Love,
    DimensionItem Career,
    DimensionItem Energy
);

public sealed record DimensionItem(int Rating, string Text);
```

**.NET 实现要点**

- 使用 `HttpClient` 调用 OpenAI 兼容端点：`POST {BaseUrl}/chat/completions`，与现有 Node 逻辑等价。
- 环境变量建议：`OPENAI_API_KEY`、`OPENAI_BASE_URL`（可选）、`OPENAI_MODEL`（可选，默认如 `gpt-4o-mini`）。
- 对用户提示词与系统提示保持与产品一致：**中文输出**、**禁止医疗/投资建议**、**仅输出 JSON 对象**。

### 14.4 规划中的 API（后续迭代）

以下接口 **尚未** 与当前前端强绑定，供 .NET 后端分阶段实现；路径与字段可在 OpenAPI 中迭代。

| 领域 | 方法 | 路径（示例） | 说明 |
|------|------|--------------|------|
| 认证 | `POST` | `/api/auth/otp/send` | 发送短信验证码（需对接短信服务商） |
| 认证 | `POST` | `/api/auth/otp/verify` | 校验验证码，签发 **JWT** 或会话 Cookie |
| 用户档案 | `GET` / `PUT` | `/api/me/profile` | 昵称、生日、星座等（需登录） |
| 树洞群聊 | `GET` | `/api/rooms/{roomId}/messages` | 分页拉取消息 |
| 树洞群聊 | `POST` | `/api/rooms/{roomId}/messages` | 发送消息；可选 **SignalR** 推送 |
| 匹配 | `POST` | `/api/match/queue` | 进入队列 |
| 匹配 | `DELETE` | `/api/match/queue` | 离开队列 |
| 匹配 | `GET` 或 WS | `/api/match/session` / SignalR | 配对结果推送 |

### 14.5 安全与合规（后端）

- **HTTPS** 终止在网关或 Kestrel 前；**JWT** 存 HttpOnly Cookie 或 `Authorization: Bearer`，视前端策略而定。
- **速率限制**（ASP.NET Core Rate Limiting）应用于 `otp/send`、公开 `horoscope`（防滥用）。
- **PII**（手机号）存储加密与脱敏策略在数据模型设计时单独立项。

### 14.6 与前端联调

- 开发：前端 `vite.config` 可将 `/api` **代理** 到 `https://localhost:7xxx`（.NET 启动端口）。
- 生产：静态 SPA 与 API **同源** 或 **CORS**；`VITE_API_BASE_URL`（若引入）指向 .NET 网关。

---

*PRD v1.2 结束*
