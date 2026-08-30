// Issue model: one frontmatter-markdown file per issue.
// Membership of pools is DERIVED from status (see CONTEXT.md) — never stored.
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const ACTIVE_POOL_STATUSES = ['Ready', 'Todo', 'In Progress', 'In Review', 'Blocked']
const BACKLOG_POOL_STATUSES = ['Backlog']

export function issuePaths(cwd) {
  const issuesDir = join(cwd, '.loopyourself', 'projects', 'default', 'issues')
  return { dir: issuesDir }
}

export function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) throw new Error('missing frontmatter')
  const meta = {}
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^([a-zA-Z]+):\s*(.*)$/)
    if (kv) meta[kv[1]] = kv[2].replace(/^['"]|['"]$/g, '')
  }
  return { meta, body: match[2] }
}

export function serializeIssue(issue) {
  const fm = [
    `id: ${issue.id}`,
    `title: ${JSON.stringify(issue.title)}`,
    `status: ${issue.status}`,
    `priority: ${issue.priority ?? 3}`,
    `labels: ${(issue.labels ?? []).join(', ')}`,
    `linearId: ${issue.linearId ?? ''}`,
    `linearUrl: ${issue.linearUrl ?? ''}`,
    `reviewRounds: ${issue.reviewRounds ?? 0}`,
    `createdAt: ${issue.createdAt}`,
    `updatedAt: ${issue.updatedAt}`,
  ]
  return `---\n${fm.join('\n')}\n---\n\n# ${issue.title}\n\n${(issue.description ?? '').trim()}\n`
}

export function loadIssues(cwd) {
  const { dir } = issuePaths(cwd)
  if (!existsSync(dir)) return []
  const files = readdirSync(dir).filter((f) => f.endsWith('.md') && f !== '.gitkeep')
  return files
    .map((f) => {
      const text = readFileSync(join(dir, f), 'utf8')
      const { meta, body } = parseFrontmatter(text)
      return {
        ...meta,
        labels: meta.labels ? meta.labels.split(',').map((s) => s.trim()).filter(Boolean) : [],
        reviewRounds: Number(meta.reviewRounds ?? 0),
        description: body.trim(),
      }
    })
    .sort((a, b) => a.id.localeCompare(b.id))
}

export function saveIssue(cwd, issue) {
  const { dir } = issuePaths(cwd)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, `${issue.id}.md`), serializeIssue(issue))
}

export function nextIssueId(issues) {
  const max = issues.reduce((m, i) => {
    const n = Number(i.id.replace(/^LY-/, ''))
    return Number.isFinite(n) && n > m ? n : m
  }, 0)
  return `LY-${String(max + 1).padStart(3, '0')}`
}

export function splitPools(issues) {
  return {
    active: issues.filter((i) => ACTIVE_POOL_STATUSES.includes(i.status)),
    backlog: issues.filter((i) => BACKLOG_POOL_STATUSES.includes(i.status)),
    terminal: issues.filter((i) => ['Done', 'Canceled'].includes(i.status)),
  }
}

export function renderBoard(issues, wipLimit) {
  const { active, backlog } = splitPools(issues)
  const lines = ['# LoopYourself Board', '']
  lines.push('## Active', '')
  if (active.length === 0) lines.push('(empty)')
  else active.forEach((i, idx) => lines.push(`${idx + 1}. ${i.id} [${i.status}] ${i.title}`))
  lines.push(`<!-- WIP limit: ${wipLimit} -->`, '')
  lines.push('## Backlog', '')
  if (backlog.length === 0) lines.push('(empty)')
  else backlog.forEach((i) => lines.push(`- ${i.id} ${i.title}`))
  lines.push('')
  return lines.join('\n')
}
