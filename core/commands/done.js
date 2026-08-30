import { loadIssues, saveIssue } from '../lib/issues.js'
import { canTransition } from '../lib/statemachine.js'
import { TERMINAL_STATUSES } from '../constants.js'
import { loadConfig } from '../lib/linearmap.js'
import { readLoopState, writeLoopState } from '../lib/loopstate.js'

// Done: only from In Review, after the SubAgent review passed and the
// requirement is judged resolved (Review Gate, CONTEXT.md).
export function runDone(cwd, args) {
  const id = args[0]
  const issues = loadIssues(cwd)
  const issue = issues.find((i) => i.id === id)
  if (!issue) {
    process.stderr.write(`error: issue ${id} not found\n`)
    process.exitCode = 1
    return
  }
  if (issue.status !== 'In Review') {
    process.stderr.write(`error: ${id} is ${issue.status} — done only allowed from In Review\n`)
    process.exitCode = 1
    return
  }
  if (!canTransition(issue.status, 'Done')) {
    process.stderr.write(`error: illegal transition ${issue.status} -> Done\n`)
    process.exitCode = 1
    return
  }
  issue.status = 'Done'
  issue.updatedAt = new Date().toISOString()
  saveIssue(cwd, issue)

  // A success breaks the consecutive-blocked streak (circuit breaker level 2).
  const loop = readLoopState(cwd)
  if (loop.consecutiveBlocked) {
    loop.consecutiveBlocked = 0
    writeLoopState(cwd, loop)
  }
  process.stdout.write(`${id}: In Review -> Done\n`)
}

// Block: circuit breaker level 1 — local-only flag, never pushed to Linear.
export function runBlock(cwd, args) {
  const id = args[0]
  if (!id) {
    process.stderr.write('usage: loopyourself block <LY-001>\n')
    process.exitCode = 1
    return
  }
  const config = loadConfig(cwd)
  const issues = loadIssues(cwd)
  const issue = issues.find((i) => i.id === id)
  if (!issue) {
    process.stderr.write(`error: issue ${id} not found\n`)
    process.exitCode = 1
    return
  }
  if (TERMINAL_STATUSES.includes(issue.status)) {
    process.stderr.write(`error: ${id} is ${issue.status} (terminal) — cannot be blocked\n`)
    process.exitCode = 1
    return
  }
  if (issue.status === 'Blocked') {
    process.stderr.write(`error: ${id} is already Blocked\n`)
    process.exitCode = 1
    return
  }
  if (issue.status === 'Backlog') {
    process.stderr.write(`error: ${id} is Backlog — not in the workflow; admit it first (ready is user-only)\n`)
    process.exitCode = 1
    return
  }
  issue.status = 'Blocked'
  issue.updatedAt = new Date().toISOString()
  saveIssue(cwd, issue)

  const loop = readLoopState(cwd)
  loop.consecutiveBlocked = (loop.consecutiveBlocked ?? 0) + 1
  const threshold = config.loop?.maxConsecutiveBlocked ?? 2
  if (loop.consecutiveBlocked >= threshold) loop.running = false
  writeLoopState(cwd, loop)

  process.stdout.write(`${id}: -> Blocked (skipped, awaiting user)\n`)
  if (!loop.running) {
    process.stdout.write(`loop stopped: ${loop.consecutiveBlocked} consecutive Blocked issues (threshold ${threshold})\n`)
  }
}
