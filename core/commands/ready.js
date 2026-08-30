import { loadIssues, saveIssue } from '../lib/issues.js'
import { TERMINAL_STATUSES } from '../constants.js'

// Admission: the ONLY gate from Backlog into the workflow.
// This command represents the USER's review decision — agents never invoke it on their own.
export function runReady(cwd, args) {
  const id = args[0]
  if (!id) {
    process.stderr.write('usage: loopyourself ready <LY-001|all>\n')
    process.exitCode = 1
    return
  }
  const issues = loadIssues(cwd)
  const targets = id === 'all'
    ? issues.filter((i) => i.status === 'Backlog')
    : issues.filter((i) => i.id === id)
  if (targets.length === 0) {
    process.stderr.write(`error: no Backlog issue found for ${id}\n`)
    process.exitCode = 1
    return
  }
  for (const issue of targets) {
    if (TERMINAL_STATUSES.includes(issue.status)) {
      process.stderr.write(`error: ${issue.id} is ${issue.status} (terminal) — cannot be admitted\n`)
      process.exitCode = 1
      continue
    }
    if (issue.status !== 'Backlog') {
      process.stderr.write(`error: ${issue.id} is ${issue.status}, not in Backlog\n`)
      process.exitCode = 1
      continue
    }
    issue.status = 'Ready'
    issue.updatedAt = new Date().toISOString()
    saveIssue(cwd, issue)
    process.stdout.write(`${issue.id}: Backlog → Ready (admitted to Active pool)\n`)
  }
}
