import { ACTIVE_POOL_STATUSES } from '../constants.js'
import { loadIssues, saveIssue } from '../lib/issues.js'
import { readLoopState, writeLoopState } from '../lib/loopstate.js'

// Reorder: the user re-sequences the Active pool — the execution order is the
// user's will. Also re-arms the loop's consecutive-blocked streak (intervention).
export function runReorder(cwd, args) {
  const order = args.filter((a) => !a.startsWith('--'))
  if (order.length === 0) {
    process.stderr.write('usage: loopyourself reorder LY-002 LY-001 [LY-003 ...]\n')
    process.exitCode = 1
    return
  }
  const issues = loadIssues(cwd)
  const known = new Set(issues.map((i) => i.id))
  const unknown = order.filter((id) => !known.has(id))
  if (unknown.length > 0) {
    process.stderr.write(`error: unknown issue(s): ${unknown.join(', ')}\n`)
    process.exitCode = 1
    return
  }
  const activeIds = issues.filter((i) => ACTIVE_POOL_STATUSES.includes(i.status)).map((i) => i.id)
  const notActive = order.filter((id) => !activeIds.includes(id))
  if (notActive.length > 0) {
    process.stderr.write(`error: not in the Active pool: ${notActive.join(', ')}\n`)
    process.exitCode = 1
    return
  }
  const given = new Set(order)
  const full = order.concat(activeIds.filter((id) => !given.has(id)))
  full.forEach((id, idx) => {
    const issue = issues.find((i) => i.id === id)
    issue.order = idx
    issue.updatedAt = new Date().toISOString()
    saveIssue(cwd, issue)
  })

  const loop = readLoopState(cwd)
  loop.consecutiveBlocked = 0
  writeLoopState(cwd, loop)

  process.stdout.write(`Active pool order: ${full.join(' -> ')}\n`)
}
