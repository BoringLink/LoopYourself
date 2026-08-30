import { existsSync, readFileSync } from 'node:fs'
import { loadIssues, saveIssue } from '../lib/issues.js'
import { canTransition } from '../lib/statemachine.js'
import { readLoopState, writeLoopState } from '../lib/loopstate.js'

// Done: only from In Review, after SubAgent review passed and the requirement
// is judged resolved (see Review Gate, CONTEXT.md).
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
  process.stdout.write(`${issue.id}: In Review -> Done\n`)
}

// Block: circuit breaker level 1 — local-only flag, never pushed to Linear.
export function runBlock(cwd, args) {
  const id = args[0]
  const config = JSON.parse(readFileSync(joinConfig(cwd), 'utf8'))
  const issues = loadIssues(cwd)
  const issue = issues.find((i) => i.id === id)
  if (!issue) {
    process.stderr.write(`error: issue ${id} not found\n`)
    process.exitCode = 1
    return
  }
  issue.status = 'Blocked'
  issue.updatedAt = new Date().toISOString()
  saveIssue(cwd, issue)

  const loop = readLoopState(cwd)
  loop.consecutiveBlocked = (loop.consecutiveBlocked ?? 0) + 1
  writeLoopState(cwd, loop)

  process.stdout.write(`${issue.id}: -> Blocked (skipped, awaiting user)\n`)
  if (loop.consecutiveBlocked >= (config.loop?.maxConsecutiveBlocked ?? 2)) {
    loop.running = false
    writeLoopState(cwd, loop)
    process.stdout.write(`loop stopped: ${loop.consecutiveBlocked} consecutive Blocked issues (threshold ${config.loop?.maxConsecutiveBlocked ?? 2})\n`)
  }
}

function joinConfig(cwd) {
  return joinPath(cwd, '.loopyourself', 'config.json')
}

import { join } from 'node:path'
function joinPath(...parts) {
  return parts.join('/')
}
