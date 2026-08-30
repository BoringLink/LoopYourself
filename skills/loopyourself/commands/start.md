---
description: Start the unattended agent loop — drives Active-pool issues from Ready to Done.
---

Follow the "The unattended loop" section of the plugin's SKILL.md exactly:

1. `loopyourself start`
2. Pick the Active pool head (never admit Backlog issues yourself).
3. Execute → SubAgent review gate → advance/done/block per the rules.
4. Push to Linear per docs/linear-protocol.md when linked.
5. Continue until the pool is empty or the circuit breaker stops the loop; then report a summary (issues done, blocked, review rounds used).
