import { loadIssues, saveIssue } from '../lib/issues.js'
import { canTransition } from '../lib/statemachine.js'

// Advance one step along the legal workflow chain.
// review-fail: In Review -> In Progress, increments reviewRounds.
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
  let to
  if (reviewFail) {
    if (issue.status !== 'In Review') {
      process.stderr.write(`error: --review-fail only valid from In Review (current: ${issue.status})\n`)
      process.exitCode = 1
      return
    }
    to = 'In Progress'
  } else {
    const options = {
      Ready: 'Todo',
      Todo: 'In Progress',
      'In Progress': 'In Review',
    }
    to = options[issue.status]
    if (!to) {
      process.stderr.write(`error: cannot advance from ${issue.status}\n`)
      process.exitCode = 1
      return
    }
  }
  if (!canTransition(issue.status, to)) {
    process.stderr.write(`error: illegal transition ${issue.status} -> ${to}\n`)
    process.exitCode = 1
    return
  }
  issue.status = to
  if (to === 'In Progress' && args.includes('--review-fail')) {
    issue.reviewRounds = (issue.reviewRounds ?? 0) + 1
  }
  issue.updatedAt = new Date().toISOString()
  saveIssue(cwd, issue)
  process.stdout.write(`${issue.id}: ${issue.status} -> ${to}\n`)
}
