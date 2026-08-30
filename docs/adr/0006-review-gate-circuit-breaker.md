# 0006 — Review 闸门 + 两级熔断 + 默认不 push

无人值守循环：每次 commit 前必须 SubAgent Review；单 Issue 修复重试超限（默认 3 轮）→ Blocked 跳过；连续 Blocked 达阈值（默认 2）→ 循环停止。循环只 commit 不 push（autoPush 可开）——本地历史可逆，push 不可逆且直接触碰用户 CI/CD。仓库约定（AGENTS.md/CI）优先级高于插件默认行为。
