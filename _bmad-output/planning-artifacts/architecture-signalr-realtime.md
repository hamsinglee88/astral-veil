---
document_type: architecture-supplement
parent: architecture.md
status: draft
project_name: astral-veil
document_language: zh-CN
related_fr: [FR-T1~FR-T3, FR-M1~FR-M5]
technology: [ASP.NET Core SignalR, @microsoft/signalr]
---

# 实时架构补充 — 树洞（群聊）与匹配（SignalR）

**范围：** 在 **ASP.NET Core** 后端采用 **SignalR** 作为 **树洞群聊** 与 **随机匹配** 的实时通道目标态；与主文档 `architecture.md` 一致，本文记录 **边界、Hub 设计、数据流与落地顺序**。  
**棕地现状：** 树洞消息与匹配队列当前为 **浏览器 `localStorage` + `BroadcastChannel`**；本文描述 **迁移后的目标架构**，而非当前实现快照。

---

## 1. 决策摘要

| 决策项 | 选择 | 说明 |
|--------|------|------|
| 实时传输 | **ASP.NET Core SignalR** | WebSocket 优先，自动降级 SSE/长轮询；与现有 .NET API 同进程或同站点部署。 |
| 客户端 | **`@microsoft/signalr`（JS）** | 与 React SPA 集成；连接、重连、JWT 由前端统一配置。 |
| 业务数据 | **REST 写库 + SignalR 推送** | 消息落库、匹配状态落库用 **HTTP** 保证幂等与审计；**SignalR 仅推送「事件」**（新消息、配对结果），避免「只活在内存里」的消息。 |
| 多实例扩展 | **Redis Backplane** 或 **Azure SignalR Service** | 自托管多 Pod/多机时必须二选一；单机开发可省略。 |
| 鉴权（增长期） | **JWT Bearer** 或 **Cookie** | Hub 内 `Context.User` 与 REST 一致；MVP 可用 **匿名连接 + 限流**，上线前必须收紧。 |

---

## 2. 与 PRD 的映射

| PRD | 能力 | SignalR 职责 |
|-----|------|----------------|
| FR-T1～T3 树洞 | 群聊、分区、持久会话 | 房间内 **广播** 新消息；历史列表仍由 **GET** 拉取或分页。 |
| FR-M1～M5 匹配 | 入队、随机配对、结果展示 | **推送**「已配对」与对端占位信息；队列权威在 **服务端**。 |
| NFR 性能/安全 | 45s 运势等（运势不走 SignalR） | 树洞/匹配连接与 **HTTP 限流**、**Hub 方法限流** 分层配置。 |

---

## 3. 逻辑架构（目标态）

```mermaid
flowchart LR
  subgraph client [React SPA]
    UI[树洞 / 匹配页]
    SR[@microsoft/signalr]
    UI --> SR
  end

  subgraph api [ASP.NET Core]
    REST[REST Controllers]
    H1[TreeHoleHub]
    H2[MatchHub]
    SVC[应用服务 / 领域服务]
    REST --> SVC
    H1 --> SVC
    H2 --> SVC
  end

  subgraph data [持久化]
    DB[(SQLite / PostgreSQL)]
    Redis[(可选 Redis Backplane)]
  end

  SR <--WebSocket--> H1
  SR <--WebSocket--> H2
  SVC --> DB
  H1 -.-> Redis
  H2 -.-> Redis
```

**原则：** 浏览器 **不** 把 SignalR 当作唯一数据源；**权威状态** 在服务端数据库；SignalR 负责 **低延迟通知** 与 **在线用户体验**。

---

## 4. Hub 划分（推荐）

### 4.1 `TreeHoleHub`（树洞 / 星河大厅）

| 方法 / 事件 | 方向 | 说明 |
|-------------|------|------|
| `JoinRoom(roomId)` | 客户端 → 服务端 | 进入「星河大厅」或未来多房间；服务端校验后加入 **SignalR Group** `room-{id}`。 |
| `SendMessage(dto)` | 客户端 → 服务端 | **推荐：** 服务端先 **REST `POST /api/treehole/messages`** 落库，成功后 **`Clients.Group(roomId).SendAsync("NewMessage", payload)`**；若坚持纯 Hub，则 Hub 内调同一套应用服务写库再广播。 |
| `NewMessage` | 服务端 → 客户端 | 负载：消息 id、作者匿名昵称、文本、分区、时间 ISO。 |
| `OnDisconnected` | 服务端 | 可选：更新在线人数、释放订阅（非 MVP 必需）。 |

**房间模型：** MVP 可 **单房间** `roomId = "lobby"`，与当前「单一大厅」产品语义一致。

### 4.2 `MatchHub`（匹配队列）

| 方法 / 事件 | 方向 | 说明 |
|-------------|------|------|
| `JoinQueue(sessionId)` | 客户端 → 服务端 | 与 **REST** `POST /api/match/queue` 二选一或组合：**REST 入队权威**，Hub 仅用于 **订阅** `Matched`；或 Hub 内调队列服务与 DB。 |
| `LeaveQueue(sessionId)` | 客户端 → 服务端 | 离开队列；服务端更新状态并停止推送。 |
| `Matched` | 服务端 → 客户端 | 负载：`selfId`、`partnerId`、演示用昵称/星座等（与现 `MatchPairEvent` 对齐）。 |
| `QueueBump`（可选） | 服务端 → 客户端 | 队列长度变化、排队提示（增强项）。 |

**队列权威：** **服务端内存 + DB** 或 **仅 DB**，禁止以浏览器 `localStorage` 为唯一真相。

---

## 5. 与 REST 的职责分工

| 操作 | 建议通道 | 原因 |
|------|----------|------|
| 拉取历史消息、翻页 | **GET** `/api/treehole/messages` | 缓存、CDN、幂等。 |
| 发送消息 | **POST** + SignalR 广播 | 写库与业务规则在服务端一处实现。 |
| 匹配入队/出队 | **POST/DELETE** + SignalR 事件 | 与 PRD 未来 `POST /api/match/queue` 一致。 |
| 运势 | **POST** `/api/horoscope` | **不走 SignalR**（请求/响应即可）。 |

---

## 6. 扩展与高可用

| 场景 | 方案 |
|------|------|
| 多 Kestrel 实例 | **Redis SignalR Backplane**（官方文档） |
| 免运维连接托管 | **Azure SignalR Service**（与 ASP.NET Core 集成成熟） |
| 消息堆积 | 仍依赖 **DB + 异步处理**；SignalR 不充当消息队列 |

---

## 7. 前端要点（React）

- 在 **`ProfileProvider` 或独立 `RealtimeProvider`** 中 **单例** 维护 `HubConnection`，避免每页 new 一个连接。
- **`withAutomaticReconnect()`**；断线后 **重新 `JoinRoom` / 重新订阅队列**（以服务端 `connectionId` 变化为前提）。
- **环境：** 开发环境 Vite 代理 **`/hubs`** 或 **`/chathub`** 到 Kestrel（与 `MapHub` 路径一致）；生产同源或反向代理 **WebSocket Upgrade**。

---

## 8. 棕地迁移路径（与当前仓库）

| 阶段 | 树洞 | 匹配 |
|------|------|------|
| **当前** | `localStorage` + 种子消息 | `BroadcastChannel` + `localStorage` 队列 |
| **过渡** | REST 只读历史 + SignalR 只推「新消息」 | REST 入队 + SignalR `Matched` |
| **目标** | 消息全量服务端存储 + 合规与审核钩子 | 服务端公平队列 + 多实例 Redis |

---

## 9. 安全与合规（上线前检查清单）

- Hub 方法 **必须** 与 **用户身份** 绑定（至少 `sessionId` / 手机号哈希与服务端会话一致）。
- **限流：** 全局 IP + 每用户 **发送频率**（树洞 UGC）。
- **日志：** 不记录消息全文于 INFO；PII 脱敏。

---

## 10. 参考资料

- [ASP.NET Core SignalR 概述](https://learn.microsoft.com/aspnet/core/signalr/introduction)
- [SignalR 横向扩展（Redis）](https://learn.microsoft.com/aspnet/core/signalr/redis-backplane)
- 主架构文档：`./architecture.md`

---

*本文档为 `architecture.md` 的补充；实现以代码评审与 OpenAPI/Hub 契约为准。*
