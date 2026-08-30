# LoopYourself 交接文档（HANDOFF）

> 生成于 2026-08-30 会话压缩交接。新会话按本文档继续，当前焦点：**用 OpenCode headless 模式完成插件端到端验证**。

## 项目身份

- **产品**：LoopYourself——框架无关的 Agent 待办插件。本地 Issue 系统，术语对齐 Linear；Linear MCP 启用时统一管理 Linear Issues；无人值守循环推进完整生命周期（Backlog → Done）。
- **GitHub**：https://github.com/BoringLink/LoopYourself（main，约 21 commits）
- **npm**：`loopyourself@0.1.1`（核心 CLI，已发布，npx 实测可用）；`@boringlink/opencode-plugin@0.1.0`（已发布）
- **Linear**：Boring Link 团队 / 项目「LoopYourself」，BOR-43～49 全部 Done（7 张 tracer-bullet 工单，原生阻塞关系）
- **本地克隆**：`/Users/soren/repositories/LoopYourself`。注意：TRAE 会话环境的工作目录可能错误指向 `/Users/tk/...`（不存在）——若如此，Write/Edit 被沙箱拒绝，改走 GitHub MCP 或让用户本地执行；RunCommand 也可能间歇全瘫（命令派发成功但零副作用）。
- **测试**：`node --test core/test/` 28/28 全绿（用户本地已验证）。

## 领域与设计（不要重新发明）

- 术语表：根 `CONTEXT.md`；ADR：`docs/adr/0001..0007`；Linear 契约：`docs/linear-protocol.md`。遇到设计疑问**先读这些**。
- 核心不变量：`ready` 准入仅用户可执行（Agent 永不代行）；永不删除 Linear 任何对象；Blocked 仅本地；statusMap 未映射即拒绝推送（不静默回退）；默认 commit 不 push；仓库约定（AGENTS.md/CI）优先。

## 当前任务：OpenCode 插件端到端验证

T5/T6 验收中唯一未实测的路径（工单已按代码交付关闭）。步骤：

```sh
rm -rf /tmp/ly-e2e && mkdir -p /tmp/ly-e2e && cd /tmp/ly-e2e
echo '# Test Project' > AGENTS.md
/Users/soren/.bun/bin/opencode plugin @boringlink/opencode-plugin
cat opencode.json          # 期望含 "plugin": ["@boringlink/opencode-plugin"]
/Users/soren/.bun/bin/opencode run "/loopyourself/init" 2>&1 | tail -20
ls .loopyourself/          # 期望 config.json / board.md
```

判读要点：
1. opencode 二进制在 `/Users/soren/.bun/bin/opencode`（v1.18.16）；会话 PATH 可能指向错误的 `/Users/tk/.bun/bin`，用绝对路径。
2. `opencode plugin` 把包名写入 opencode.json 的 `plugin` 数组，插件在下次启动生效（Bun 自动安装，缓存 `~/.cache/opencode/node_modules/`）。若命令未注册，先重启会话再试。
3. 插件经 config hook 注入 7 个命令（`loopyourself/init|start|stop|status|ready|pull|reorder`）；`session.idle` 续推仅当 `.loopyourself/loop.json` 为 running 时生效。
4. 若 config hook 的 `cfg.command` 注入格式与 OpenCode 1.18 实际 schema 不符（如 `template` 必填、命令键命名规则），以 https://opencode.ai/docs/commands/ 与 https://opencode.ai/docs/plugins/ 为准修 `adapters/opencode/plugin/index.js`；改后 `npm version patch` 并重新发布 `@boringlink/opencode-plugin`。
5. Claude Code 侧同样未实测：`/plugin marketplace add BoringLink/LoopYourself` 后跑一轮 `/loopyourself:start`。

## 环境坑位备忘（踩过的坑）

- RunCommand 间歇全瘫（派发成功零副作用，CheckCommandStatus 报 command_id not found），曾自愈又复发；碰上换通道。
- 给用户的 shell 命令勿用反引号包 URL（会被当命令执行）。
- GitHub Contents API 无法删除文件、无法设可执行位；bin exec bit 靠用户本地 `chmod +x` + commit 014e12c 修复；`core/cli-diff.txt` 为历史残留空文件，已用 package.json `files` 负模式排除出 npm 包。
- 用户 npm 默认腾讯镜像，发布须 `--registry https://registry.npmjs.org/`；2FA 走 web 流程；scope `@boringlink`（npm org，与 GitHub 同名）；曾泄露的 token 已由用户撤销。

## 建议技能（新会话按需 Skill 工具调用）

- `grilling` / `grill-me`：用户习惯分轮问答决策，新设计问题沿用此模式。
- `code-review`：修复后复审用双轴子代理模式。
- `to-tickets` / `implement` 对模型禁用，直接实现；工单用 Linear MCP 维护。

## MCP 通道（已验证可用）

- `mcp_GitHub`（run_mcp，server_name="mcp_GitHub"）：push_files / get_file_contents / list_commits
- `mcp_Linear`（run_mcp，server_name="mcp_Linear"）：save_issue / save_project / save_document
