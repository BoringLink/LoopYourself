import { loadIssues, saveIssue } from '../lib/issues.js'

// Attach: record the Linear link (linearId/linearUrl) on a local issue.
// Called by the agent after creating the issue on Linear via MCP
// (push protocol, docs/linear-protocol.md).
export function runAttach(cwd, args) {
  const [id, linearId, linearUrl] = args
  if (!id || !linearId) {
    process.stderr.write('usage: loopyourself attach <LY-001> <linear-issue-id> [linear-url]\n')
    process.exitCode = 1
    return
  }
  const issues = loadIssues(cwd)
  const issue = issues.find((i) => i.id === id)
  if (!issue) {
    process.stderr.write(`error: issue ${id} not found\n`)
    process.exitCode = 1
    return
  }
  issue.linearId = linearId
  issue.linearUrl = linearUrl ?? ''
  issue.updatedAt = new Date().toISOString()
  saveIssue(cwd, issue)
  process.stdout.write(`${id}: linked Linear issue ${linearId}\n`)
}
