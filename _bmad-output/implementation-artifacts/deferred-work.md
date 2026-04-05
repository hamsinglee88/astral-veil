# Deferred work (from code reviews)

## Deferred from: code review of 4-2-random-pairing.md (2026-04-06)

- **多标签页 `localStorage` 竞态**：两个标签几乎同时 `readQueue` / `writeQueue` 时可能丢更新或重复入队；MVP 依赖 BroadcastChannel 缓解但不等价于服务端队列。若产品上需强公平，后续迁移到 `POST /api/match/queue` 等方案再处理。

## Deferred from: code review of 5-1-bottom-nav-four-tabs.md (2026-04-07)

- **底部主导航 Tab 语义**：当前为按钮组 + `aria-current`；若需与 WAI-ARIA Tabs 模式完全一致，可改为 `tablist` / `tab` / `tabpanel` 并与路由面板联动，属增强项非 MVP。
