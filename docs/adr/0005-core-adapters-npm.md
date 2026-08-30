# 0005 — 核心与适配分层，npm 分发

零依赖 Node 核心 CLI（npm 包 loopyourself）+ 各框架薄适配层（Claude Code marketplace 二合一 / OpenCode npm 插件）。核心不含框架特定逻辑；循环语义（skill 文档）跨框架共享不分叉。理由：npm 是 OpenCode 唯一体面分发通道，且为 Hooks 提供确定性执行入口。
