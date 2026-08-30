# Linear Integration Protocol (for Agents)

This document is the CONTRACT between LoopYourself and any agent framework adapter.
The core CLI never talks to Linear directly — all Linear reads/writes go through the
agent invoking Linear MCP tools (ADR-0001).

## Invariants (MUST hold at all times)

1. **NEVER delete.** No issue, project, team, comment, or any other object on Linear
   may be deleted, archived, or trashed through this system. Only create/update.
2. **Linear Scope.** Every Linear create/update must land inside the team/project
   recorded in `.loopyourself/config.json` → `linear`. Refuse anything outside.
3. **StatusMap is mandatory.** Before pushing any status change, resolve the local
   status via `loopyourself verify`. Unmapped status ⇒ refuse to push. No silent
   fallback to a default Linear state (ADR-0004).
4. **Blocked is local-only.** Never push the Blocked flag to Linear.
5. **One-way push.** Local state is the source of truth. Push on every status
   transition. Pull only when the user explicitly asks.

## Push protocol (status transition)

When the CLI reports a transition `LY-001: In Review -> Done`:

1. Read the issue file; if `linearId` is empty and the issue has entered the workflow
   (status ≥ Ready), create it on Linear via MCP:
   - team/project from config `linear` scope
   - title/description from the local issue
   - state = `resolveLinearState(config, 'Ready')` (or the current status)
   - write the returned `linearId`/`linearUrl` back into the local issue frontmatter
2. If `linearId` exists, update the Linear issue state to
   `resolveLinearState(config, newStatus)`.
3. If the MCP tool reports the target state name does not exist on the team, surface
   the error to the user — do NOT guess a similar state.

## Pull protocol (user-initiated)

When the user asks to pull Linear updates:

1. List issues in the configured Linear scope via MCP.
2. For each Linear issue: if a local issue carries its `linearId`, update local fields
   (title, description, labels, priority).
3. Status mapping on pull is BY LINEAR STATE **TYPE** (category), not name:
   - `backlog` → local Backlog
   - `unstarted` → local Ready (admission is implied — the user moved it on Linear)
   - `started` → local In Progress (unless local is In Review; In Review wins locally)
   - `completed` → local Done
   - `canceled` → local Canceled
   - `duplicate` → keep local state, render as terminal "Duplicate" on the board
4. New Linear issues with no local counterpart are created locally as Backlog
   (never auto-admitted — the admission gate stays user-only, ADR-0003).

## Scope guard for agents

Before every Linear MCP call, re-read `config.json` `linear` scope. If a tool result
references issues outside the scope, ignore them and warn.
