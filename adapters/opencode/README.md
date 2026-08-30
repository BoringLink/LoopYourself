# OpenCode adapter

## Install

```sh
opencode plugin @loopyourself/opencode-plugin
```

This writes the package into your `opencode.json` `plugin` array; OpenCode
auto-installs it on next startup (Bun, cached in `~/.cache/opencode/node_modules/`).

The plugin injects the seven commands under `/loopyourself/`:

- `/loopyourself/init` — initialize `.loopyourself/`
- `/loopyourself/start` — start the unattended loop
- `/loopyourself/stop` — stop the loop
- `/loopyourself/status` — two-pool board
- `/loopyourself/ready` — **USER ONLY** admission gate
- `/loopyourself/pull` — pull Linear updates (user-initiated)
- `/loopyourself/reorder` — re-sequence the Active pool

## Loop continuation

When `.loopyourself/loop.json` says `running: true`, the plugin listens for
`session.idle` and asks the session to continue the loop (pick the next issue,
never admit Backlog, stop on circuit breaker).

## Linear guard

The core rules (never delete, scope guard, statusMap) live in the shared
`docs/linear-protocol.md` at the repository root — same contract as the Claude
Code adapter, no divergence.
