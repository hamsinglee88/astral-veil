# Story 6.1 — 树洞实时广播（TreeHoleHub）

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

作为用户，我希望在同一树洞房间内，其他在线用户发送的消息能即时出现在我的屏幕上，无需手动刷新。

## Acceptance Criteria

1. **AC1** — 至少两名客户端（不同浏览器或不同机器）连上同一 **房间**（如 `lobby`）后，用户 A 通过应用发送一条合法树洞文本，用户 B 在**数秒内**收到 **SignalR 事件 `NewMessage`**，内容与发送一致（FR-T1、FR-T2 增长态语义）。[Source: `_bmad-output/planning-artifacts/epics.md` — Story 6.1]
2. **AC2** — 后端提供 **ASP.NET Core SignalR Hub**（`TreeHoleHub`），支持加入房间组并广播；路径与开发代理一致，浏览器控制台无持续性连接错误。
3. **AC3** — 前端使用 **`@microsoft/signalr`** 建立连接，进入树洞页时 **JoinRoom**，并订阅 `NewMessage` 更新 UI（可与现有 `TreeHolePage` / `treeHole.ts` 合并或并存，**不得**破坏未启用实时时的基本降级路径，若采用特性开关需明确）。
4. **AC4** — **本 Story 不要求**消息落库（属 Story 6.2）；广播可为 Hub 内校验后直推，或「先内存队列再推」的最小实现，但须在 Dev Notes 写明与 6.2 的衔接点。

## Tasks / Subtasks

- [x] **后端** — 添加 `TreeHoleHub`：`JoinRoom(roomId)`，将 `ConnectionId` 加入 Group `room-{roomId}`；提供 `SendMessage` 或等价服务端方法，向该组 `SendAsync("NewMessage", payload)`（payload 含 id、author、text、category、time ISO 等，与 `architecture-signalr-realtime.md` §4.1 对齐）。(AC: 1,2)
- [x] **后端** — `Program.cs`：`builder.Services.AddSignalR()`，`app.MapHub<TreeHoleHub>("/hubs/treehole")`（路径可微调，须与前端一致）。(AC: 2)
- [x] **CORS / 反向代理** — 开发环境：Vite 对 **`/hubs`** 做 `proxy` 到 Kestrel（与 `/api` 同源策略一致），保证 WebSocket 升级不被挡。(AC: 2)
- [x] **前端** — `npm` 增加 `@microsoft/signalr`；新增小模块（如 `src/lib/treeHoleSignalR.ts`）封装单例 `HubConnection`、`withAutomaticReconnect`、JoinRoom、订阅 `NewMessage`。(AC: 3)
- [x] **前端** — `TreeHolePage`（或 provider）：挂载时连接 Hub、加入 `lobby`（或当前产品房间 id）；收到 `NewMessage` 时 **append** 到列表（区分 `self` 与远端作者展示）。(AC: 1,3)
- [x] **验证** — 双浏览器手工验收 AC1；`npm run lint` / `npm run test` 通过；.NET 项目可 `dotnet build`。(AC: 全部)

## Dev Notes

### 范围与不做的事

- **本 Story 完成「多用户实时看见」**；**不要求** REST 持久化、不要求 Story 6.3 的 `MatchHub`。
- 现有 MVP：`src/lib/treeHole.ts` 的 **localStorage** 仍可能存在；推荐策略二选一并在实现中写清：**(a)** 实时消息仅内存+推送展示，刷新后仍读 localStorage；**(b)** 实时与 localStorage 合并去重。避免无限重复条目。

### 架构必须遵循

- [Source: `_bmad-output/planning-artifacts/architecture-signalr-realtime.md`]
  - 单房间可先固定 **`roomId = "lobby"`**，与「星河大厅」产品语义一致。
  - 目标态为 **REST 写库 + Hub 广播**；本 story 若先做 Hub 内广播，须在 6.2 改为「POST 成功后广播」同一套 payload 形状。
  - 前端 **单例 Hub 连接**，避免每页 `new HubConnection()`。

### 代码与路径

- **.NET**：`server/AstralVeil.Api/`（已有 `Program.cs`、`AppDbContext`）；本 story 新增 `Hubs/TreeHoleHub.cs`（或项目约定目录）。
- **Vite**：[Source: `vite.config.ts`] 已有 `/api` → `VITE_USE_DOTNET_API` 时转发；需**追加** `/hubs` → 同一 `apiTarget`（如 `http://localhost:5020`），`ws: true` 若需显式开启 WebSocket 代理（Vite 默认对 HTTP 代理会升级 WS）。
- **包版本**：`@microsoft/signalr` 使用当前稳定版；与 React 19 / Vite 6 兼容即可。

### 与 Epic 5 / 3 的关系

- [Source: `_bmad-output/implementation-artifacts/3-1-tree-hole-room.md`] — 树洞 UI 与种子消息模式已存在；本 story **扩展**数据入口，不删除 FR-T1/T2 MVP 行为，除非团队明确切换「仅服务端」。

### 安全（最小）

- 开发环境可匿名连接；在 Hub 方法中对 **消息长度、空串** 做校验，避免 obvious 滥用（与架构 §9 方向一致，完整限流可 6.x 后续加）。

### Testing

- 单元测试：可对 payload 映射、room id 规范化做纯函数测试（若抽取）。
- 集成：以手工双浏览器为主；可选后续为 Hub 加 `Microsoft.AspNetCore.SignalR.Client` 测试客户端（非本 story 阻塞项）。

## Dev Agent Record

### Agent Model Used

Composer（Cursor Agent）

### Debug Log References

### Completion Notes List

- 已实现 `TreeHoleHub`（`JoinRoom` / `SendMessage`，`OthersInGroup` 广播 `NewMessage`）；不落库，与 Story 6.2 衔接说明见 Hub 文件注释。
- 前端仅在 `VITE_USE_DOTNET_API=true` 时连接 Hub；否则保持原 localStorage 树洞，满足降级路径。
- Vite 增加 `/hubs` WebSocket 代理；`src/vite-env.d.ts` 补齐 `import.meta.env` 类型。

### File List

- `server/AstralVeil.Api/Hubs/TreeHoleHub.cs`（新建）
- `server/AstralVeil.Api/Program.cs`（修改）
- `vite.config.ts`（修改）
- `src/lib/treeHoleSignalR.ts`（新建）
- `src/lib/treeHoleSignalR.test.ts`（新建）
- `src/vite-env.d.ts`（新建）
- `src/components.tsx`（修改）
- `package.json` / `package-lock.json`（`@microsoft/signalr`）
- `.env.example`（修改）

### Change Log

- Story 6.1 实现：ASP.NET Core SignalR TreeHoleHub + Vite `/hubs` 代理 + React 树洞页实时订阅与发送。
