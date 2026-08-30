# 0004 — StatusMap 强制，未映射即报错

link 后每个需推送的本地状态必须在 statusMap 中配置目标 Linear 状态名，否则推送前置校验报错，绝不静默回退到默认状态。理由：静默回退会造成语义错位（如自定义 QA 收到 In Review 却推成 Done）；显式失败可操作。本地状态全集：Backlog/Ready/Todo/In Progress/In Review/Done/Canceled（Duplicate 仅 Linear 侧）。
