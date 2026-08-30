---
description: Pull issue updates from Linear (user-initiated) into the local board.
---

Only run when the user explicitly asks. Read `docs/linear-protocol.md` (plugin root), then:

1. Fetch issues in the configured Linear scope via Linear MCP.
2. Apply the pull protocol: map by state TYPE, update linked local issues, create unlinked ones as Backlog (never auto-admit).
3. Show the updated board via `loopyourself status`.
