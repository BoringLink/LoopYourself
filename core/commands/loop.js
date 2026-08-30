import { readLoopState, writeLoopState } from '../lib/loopstate.js'
import { loadIssues } from '../lib/issues.js'

// Start/stop the unattended loop (loop state is machine-local, not committed intent).
export function runStart(cwd) {
  const loop = readLoopState(cwd)
  loop.running = true
  loop.consecutiveBlocked = 0
  writeLoopState(cwd, loop)
  const issues = loadIssues(cwd)
  const active = issues.filter((i) => ['Ready', 'Todo', 'In Progress', 'In Review', 'Blocked'].includes(i.status))
  process.stdout.write(`loop started. active pool: ${active.length} issue(s)\n`)
}

export function runStop(cwd) {
  const loop = readLoopState(cwd)
  loop.running = false
  writeLoopState(cwd, loop)
  process.stdout.write('loop stopped.\n')
}

export function runLoopStatus(cwd) {
  const loop = readLoopState(cwd)
  process.stdout.write(`loop ${loop.running ? 'running' : 'stopped'} (consecutive blocked: ${loop.consecutiveBlocked ?? 0})\n`)
}
