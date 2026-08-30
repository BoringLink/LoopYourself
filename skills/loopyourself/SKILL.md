---
name: loopyourself

description: Manage the LoopYourself todo system: create and admit issues, run the unattended agent loop that drives issues from Ready to Done, sync with Linear via MCP. Use when the user mentions LoopYourself, the board, issues, or says /loopyourself: commands, or asks to start/stop/check the loop.
---

# LoopYourself

A todo system aligned with Linear terminology. Two pools: **Backlog** (requests awaiting user review, outside the workflow) and **Active** (the ordered execution pool). Agents run an unattended loop from **Ready → Todo → In Progress → In Review → Done** with a SubAgent review gate and a two-level circuit breaker.

Read the full protocol at `docs/linear-protocol.md` in the plugin root before touching Linear.

## Core rules (invariants)

1. **Admission is user-only.** Never run `ready` yourself. You may only pick up issues already in `Ready` or later.
2. **NEVER delete on Linear.** Only create/update. The plugin also hard-blocks destructive Linear MCP calls via a PreToolUse hook.
3. **Obey repository conventions.** AGENTS.md, existing tests, lint, CI/CD take precedence over plugin defaults.
4. **Commit by default, never push** unless the user enabled `autoPush` in config.
5. **Blocked is local-only.** Never push it to Linear.

## Commands (invoke via `npx loopyourself <cmd>` if not installed globally)

- `init` — initialize `.loopyourself/`
- `create <title>` — create issue in Backlog
- `ready <LY-001|all>` — **USER ONLY** — admit into workflow
- `advance <id> [--review-fail]` — move one step along the workflow
- `done <id>` — In Review → Done (after review passes & requirement resolved)
- `block <id>` — circuit breaker: mark Blocked
- `start` / `stop` / `loop` — control the unattended loop
- `reorder <ids...>` — **USER** — re-sequence the Active pool
- `link <team> [project]` — record Linear scope
- `verify` — statusMap push preflight
- `status` — render the two-pool board

## The unattended loop (when the user starts it)

When the user runs `/loopyourself:start` (or asks you to start the loop):

1. Run `loopyourself start`.
2. **Pick** the head of the Active pool (`status` output, first non-Blocked issue). Never admit Backlog issues.
3. **Execute** the issue: read its description; follow repository conventions (AGENTS.md tests/lint before committing).
4. **Review gate:** before committing, spawn a SubAgent to review the diff against the issue's acceptance criteria.
   - Review passes AND requirement resolved → `loopyourself advance <id>` (to In Review), then `done <id>`, commit, pick the next issue.
   - Review fails → `loopyourself advance <id> --review-fail` (back to In Progress), fix, repeat. Do not retry more than `review.maxRounds` (default 3) — then `loopyourself block <id>` and move on.
   - If `block` reports the loop stopped (consecutive threshold reached), stop and summarize for the user.
5. **Linear push:** if `config.json` → `linear` is linked and the issue has `linearId`, push the state change via Linear MCP following `docs/linear-protocol.md`. Run `loopyourself verify` first; if it fails, continue the loop locally and surface the mapping error.
6. Repeat until the Active pool is empty, then run `loopyourself stop` and report.

## Linear pull (user-initiated only)

Only when the user explicitly asks: fetch issues in the configured Linear scope via MCP, apply the pull protocol from `docs/linear-protocol.md` (state-type based mapping; new issues land as Backlog, never auto-admitted).
