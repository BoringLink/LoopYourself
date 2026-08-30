import { loadIssues, saveIssue, nextIssueId } from '../lib/issues.js'

export function runCreate(cwd, args) {
  const labels = []
  const titleParts = []
  let priority = null
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--priority') {
      priority = args[++i]
    } else if (arg.startsWith('--label:')) {
      labels.push(arg.slice('--label:'.length))
    } else {
      titleParts.push(arg)
    }
  }
  const title = titleParts.join(' ').trim()
  if (!title) {
    process.stderr.write('usage: loopyourself create <title> [--priority 0-4] [--label:x]\n')
    process.exitCode = 1
    return
  }
  const issues = loadIssues(cwd)
  const now = new Date().toISOString()
  const issue = {
    id: nextIssueId(issues),
    title,
    status: 'Backlog',
    priority: priority !== null ? Number(priority) : 3,
    labels,
    reviewRounds: 0,
    createdAt: now,
    updatedAt: now,
    description: '',
  }
  saveIssue(cwd, issue)
  process.stdout.write(`Created ${issue.id} [Backlog] ${issue.title}\n`)
}
