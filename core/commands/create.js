import { loadIssues, saveIssue, nextIssueId } from '../lib/issues.js'

export function runCreate(cwd, args) {
  const title = args.join(' ').trim()
  if (!title) {
    process.stderr.write('usage: loopyourself create <title> [--priority 0-4] [--label x]\n')
    process.exitCode = 1
    return
  }
  const priority = extractFlag(args, '--priority')
  const labels = args.filter((a) => a.startsWith('--label:')).map((a) => a.slice(7))
  const issues = loadIssues(cwd)
  const now = new Date().toISOString()
  const issue = {
    id: nextIssueId(issues),
    title,
    status: 'Backlog',
    priority: priority ? Number(priority) : 3,
    labels,
    reviewRounds: 0,
    createdAt: now,
    updatedAt: now,
    description: '',
  }
  saveIssue(cwd, issue)
  process.stdout.write(`Created ${issue.id} [Backlog] ${issue.title}\n`)
}

function extractFlag(args, name) {
  const idx = args.indexOf(name)
  return idx >= 0 ? args[idx + 1] : null
}
