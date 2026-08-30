import { loadIssues, saveIssue } from '../lib/issues.js'

// Reorder: user re-sequences the Active pool (the execution order is the user's will).
// Also used to unblock: moving a Blocked issue back to the queue head as In Progress
// resets its consecutive-blocked contribution at the loop level (fresh retry budget).
export function runReorder(cwd, args) {
  const order = args.filter((a) => !a.startsWith('--'))
  if (order.length === 0) {
    process.stderr.write('usage: loopyourself reorder LY-002 LY-001 [LY-003 ...]\n')
    process.exitCode = 1
    return
  }
  const issues = loadIssues(cwd)
  const ids = new Set(order)
  const unknown = order.filter((id) => !issues.find((i) => i.id === id))
  if (unknown.length > 0) {
    process.stderr.write(`error: unknown issue(s): ${unknown.join(', ')}\n`)
    process.exitCode = 1
    return
  }
  // Persist order as a zero-padded sequence hint in each issue file.
  const activeIds = issues.filter((i) => !['Backlog', 'Done', 'Canceled'].includes(i.status)).map((i) => i.id)
  const full = order.concat(activeIds.filter((id) => !ids.has(id)))
  full.forEach((id, idx) => {
    const issue = issues.find((i) => i.id === id)
    issue.order = idx
    issue.updatedAt = new Date().toISOString()
    saveIssue(cwd, issue)
  })
  process.stdout.write(`Active pool order: ${full.join(' -> ')}\n`)
