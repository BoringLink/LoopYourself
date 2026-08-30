# LoopYourself

一个框架无关的 Agent 待办插件上下文：本地 Issues 系统以 Linear 术语运作，并在 Linear MCP 可用时与 Linear 联动（推送单向、拉取按需），由 Agent 无人值守推进。

## Language

### 工作流与状态

**Issue**:
一个可独立执行与评审的工作单元，是系统的最小管理对象。术语与 Linear Issue 对齐。
_避免_: Task, Ticket, 需求

**Backlog**:
工作流之外的需求池。其中的 Issue 尚未经用户评审，不构成任何执行承诺。术语与 Linear Backlog 对齐（Backlog 不进入工作流）。
_避免_: 等待池, Inbox

**Admission（准入）**:
用户将 Backlog 中的 Issue 评审通过、纳入工作流的动作。准入是用户的专属权力，Agent 永不代行。
_避免_: 拉取, 派工

**Ready**:
Active 池的入口状态，表示「已经人工评审、允许 Agent 领取执行」，是无人值守循环的领取闸门。
_避免_: ready-for-agent（作为本地状态名）, Queued

**Active（执行池）**:
处于 Ready 及之后状态的全部 Issue 的集合，按有序队列维护。池成员资格完全由状态推导，不存在独立的池成员标记。
_避免_: Sprint

**Todo**:
已领取、尚未开始编码的状态。

**In Progress**:
Agent 正在执行的状态。

**In Review**:
实现完成、正在接受 SubAgent Review 的状态。与 Linear In Review 对齐。

**Done**:
Review 通过且需求被评判为已解决的终态。

**Canceled**:
被放弃的终态。术语与 Linear Canceled 对齐。

**Duplicate**:
仅存在于 Linear 侧的关系性终态（此 Issue 与另一 Issue 重复）。本地状态机不含此状态；拉取时按终态识别并显示。
_避免_: 在本地创建同名状态

**Blocked**:
本地专属的熔断标记：Issue 因反复无法通过 Review 而被循环跳过、等待用户介入。不推送到 Linear。
_避免_: Failed, Error

**Terminal State（终态）**:
Issue 生命周期的终点：Done、Canceled，以及拉取自 Linear 的 Duplicate。

### 循环与执行

**Loop（循环）**:
无人值守的自动推进过程：从 Active 池按序领取 → 执行 → Review → 流转，直到池空或熔断停止。
_避免_: 流水线, pipeline

**Review Gate（评审闸门）**:
每次提交前由 Agent 启动 SubAgent 对提交内容进行评审的强制环节。评审通过且需求被评判解决才可流转 Done。
_避免_: 验收（隐含人工语义）, QA

**Circuit Breaker（熔断）**:
两级止损机制：单 Issue 修复重试超限 → 标记 Blocked 跳过；连续多个 Issue Blocked → 循环停止。
_避免_: 重试上限（仅指第一级）

**WIP Limit**:
Active 池中同时处于执行中的 Issue 数量上限。默认 1，多 Agent 环境可调大。

**Repository Conventions（仓库约定）**:
目标仓库既有的工程约定（AGENTS.md、测试、lint、CI/CD 流程）。循环执行全程必须遵守，优先级高于本插件的默认行为。

**Auto Push（自动推送）**:
循环产生的 git commit 是否自动 push 的行为开关。默认关闭。

### Linear 联动

**Link（关联）**:
本地 Issue 与 Linear Issue 的对应关系，以 Linear Issue ID 记录。关联建立后，状态变更单向推送。
_避免_: 同步, mirror

**Push（推送）**:
本地状态变更单向写入 Linear 的动作。由 Agent 经 Linear MCP 完成，核心 CLI 永不直连 Linear。
_避免_: 同步, 提交（与 git commit 混淆）

**Pull（拉取）**:
从 Linear 云端获取 Issues 更新并反映到本地的动作。由用户显式发起，或经用户 Prompt 由 Agent 执行。
_避免_: sync, import

**StatusMap（状态映射）**:
本地状态名到 Linear 目标团队 workflow 状态名的映射表。link 后为强制配置：未映射的状态推送即报错，绝不静默回退。
_避免_: 默认映射, fallback

**Linear Scope（Linear 范围）**:
用户 link 时配置记录的 Linear team/project。所有经本系统的 Linear 创建与更新必须落在此范围内。
_避免_: workspace（范围粒度是 team/project）

### 结构

**Project（本地项目）**:
仓库内 Issue 的分组容器，与 Linear Project 层级对齐。Team 不作为本地层级（由 Linear Scope 记录）。
_避免_: 模块

**Board（看板）**:
呈现两个池与各 Issue 状态的单一视图文件。
_避免_: dashboard

**Adapter（适配层）**:
将核心 CLI 接入具体 Agent 框架（Claude Code / OpenCode）的声明与接线层。核心不含任何框架特定逻辑。
_避免_: connector, binding
