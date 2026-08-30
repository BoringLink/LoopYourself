import { existsSync, readFileSync } from 'node:fs'
import { dataPaths } from '../lib/fsutil.js'
import { loadIssues, renderBoard } from '../lib/issues.js'

export function runStatus(cwd) {
  const paths = dataPaths(cwd)
  if (!existsSync(paths.config)) {
    process.stdout.write('Not initialized. Run `loopyourself init` first.\n')
    process.exitCode = 1
    return
  }
  const config = JSON.parse(readFileSync(paths.config, 'utf8'))
  const issues = loadIssues(cwd)
  process.stdout.write(renderBoard(issues, config.wipLimit))
  const { active, backlog, terminal } = {
    active: issues.filter((i) => ['Ready', 'Todo', 'In Progress', 'In Review', 'Blocked'].includes(i.status)),
    backlog: issues.filter((i) => i.status === 'Backlog'),
    terminal: issues.filter((i) => ['Done', 'Canceled'].includes(i.status)),
  }
  process.stdout.write(
    `\nsummary: active ${active.length} (WIP limit ${config.wipLimit}), backlog ${backlog.length}, done ${terminal.length}\n`,
  )
}
