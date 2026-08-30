# LoopYourself

一个框架无关的 Agent 待办插件。本地 Issue 系统的术语与 Linear 原生对齐——当你的
Agent 框架启用了 Linear MCP 时，你可以在同一套系统里管理 Linear 上的 Issues。

Agent 无人值守地推进 Issue 走完 Linear 完整生命周期（Backlog → Done）：从规划、
评审到完成。

## 理念

你用 Linear 的词汇和 Agent 交流（Backlog、In Review、Done……），你的待办系统也
应该如此。LoopYourself 把 Issue 存为仓库里的纯 Markdown，在其上运行**无人值守
Agent 循环**，并经 Agent 自己的 MCP 连接把状态变更单向推送到 Linear。Agent 不
需要 Linear token；循环不需要你盯着。

## 模型

- **Backlog**——需求池，处于工作流之外（同 Linear）。Issue 等待**你的**评审，
  Agent 永不自行准入。
- **Ready**——准入闸门。`ready` 是**用户专属**命令：把 Issue 移入 Active 池并
  标记为 Ready，允许 Agent 领取。
- **Active**——有序执行池（WIP 上限，默认 1，可配置）。
- **无人值守循环**——Agent 领取 Active 池队头，实现，每次提交前启动 **SubAgent
  评审闸门**，随后沿 `Ready → Todo → In Progress → In Review → Done` 流转。
- **熔断**——失败的 Issue 最多获得 `maxRounds`（默认 3）轮评审重试，之后标记
  `Blocked`（仅本地）并跳过；连续 Blocked 会停止整个循环等你介入。
- **Linear 关联**——经 Linear MCP 单向推送。本地状态是事实源；仅在你要求时拉取。
  `statusMap` 为强制配置并经校验——未映射的状态拒绝推送，绝不静默回退。

### 硬保证

- **永不删除 Linear 上的任何内容**——Issues、Projects、Teams，一律不删。
  Claude Code 适配层还额外硬拦截破坏性的 Linear MCP 调用。
- **仓库约定优先**——AGENTS.md、你的测试、lint、CI/CD，循环全程遵守。
- **默认只 commit 不 push**——除非你打开 `autoPush`。

## 安装

### Claude Code

```text
/plugin marketplace add BoringLink/LoopYourself
/plugin install loopyourself@loopyourself-marketplace
```

命令为 `/loopyourself:init`、`/loopyourself:start`、`/loopyourself:stop`、
`/loopyourself:status`、`/loopyourself:ready`、`/loopyourself:pull`、
`/loopyourself:reorder`。

### OpenCode

```sh
opencode plugin @loopyourself/opencode-plugin
```

命令为 `/loopyourself/init` … `/loopyourself/reorder`；循环运行期间会在
`session.idle` 时自动续推。

### 其他任意 Agent 框架

核心是 npm 上的零依赖 Node CLI：

```sh
npm i -g loopyourself   # 或：npx loopyourself <cmd>
```

任何能跑 shell 命令、能读 Markdown 的 Agent 都能驱动它——Linear 契约见
`docs/linear-protocol.md`。

## 快速开始

```sh
cd your-project
loopyourself init                 # 创建 .loopyourself/（建议提交进 git）
loopyourself create "修复登录超时"
loopyourself ready LY-001         # 由你准入（用户专属闸门）
loopyourself start                # 之后交给 Agent 循环
```

在 Claude Code / OpenCode 里，`/loopyourself:start` 做同样的事并替你驱动循环。

### 关联 Linear

```sh
loopyourself link <team> [project]
```

然后在 `.loopyourself/config.json` 里填写 `statusMap`（每个本地状态映射到哪个
Linear workflow 状态），执行 `loopyourself verify`。映射不全时推送会被拒绝——
这是有意设计。

## 目录结构

```
.loopyourself/
├── config.json        # 行为配置 + Linear 范围 + statusMap
├── board.md           # 渲染后的两池看板
└── projects/default/issues/LY-001.md   # 每个 Issue 一个 frontmatter 文件
```

数据默认提交进 git（Issue 成为可共享、可评审的历史）；想仅本地使用可 gitignore
`.loopyourself/`。

## 文档

- [术语表（CONTEXT.md）](./CONTEXT.md)——领域词汇
- [Linear 协议](./docs/linear-protocol.md)——Agent 的 Linear 契约
- [ADR](./docs/adr/)——关键架构决策

## 许可

MIT——见 [LICENSE](./LICENSE)。个人使用免费；商用授权另行联系。
