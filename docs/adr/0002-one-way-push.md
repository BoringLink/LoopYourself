# 0002 — 单向推送 + link，本地为 source of truth

本地状态变更由 Agent 经 MCP 单向写入 Linear，建立 link 后不回写；用户可显式让 Agent 拉取 Linear 侧更新。否决了双向同步（无 webhook 的 MCP 环境中冲突难以处理）与 Linear 为主存储（离线不可用）。
