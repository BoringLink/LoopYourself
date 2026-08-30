import { loadIssues, saveIssue } from '../lib/issues.js'
import { canTransition } from '../lib/statemachine.js'

// Advance one step along the legal workflow chain.
// --review-fail: In Review -> In Progress, increments reviewRounds.
// Blocked -> In Progress resumes a circuit-broken issue.
export function runAdvance(cwd, args) {
  const id = args[0]
  if (!id) {
    process.stderr.write('usage: loopyourself advance <LY-001> [--review-fail]\n')
    process.exitCode = 1
    return
  }
  const reviewFail = args.includes('--review-fail')
  const issues = loadIssues(cwd)
  const issue = issues.find((i) => i.id === id)
  if (!issue) {
    process.stderr.write(`error: issue ${id} not found\n`)
    process.exitCode = 1
    return
  }
  const from = issue.status
  let to
  if (reviewFail) {
    if (from !== 'In Review') {
      process.stderr.write(`error: --review-fail only valid from In Review (current: ${from})\n`)
      process.exitCode = 1
      return
    }
    to = 'In Progress'
  } else {
    const next = { Ready: 'Todo', Todo: 'In Progress', 'In Progress': 'In Review', Blocked: 'In Progress' }
    to = next[from]
    if (!to) {
      process.stderr.write(`error: cannot advance from ${from}\n`)
      process.exitCode = 1
      return
    }
  }
  if (!canTransition(from, to)) {
    process.stderr.write(`error: illegal transition ${from} -> ${to}\n`)
    process.exitCode = 1
    return
  }
  issue.status = to
  if (reviewFail) issue.reviewRounds = (issue.reviewRounds ?? 0) + 1
  issue.updatedAt = new Date().toISOString()
  saveIssue(cwd, issue)
  process.stdout.write(`${id}: ${from} -> ${to}\n`)
}
