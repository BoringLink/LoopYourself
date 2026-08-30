import { existsSync, readFileSync } from 'node:fs'
import { dataPaths } from '../lib/fsutil.js'

export function runStatus(cwd) {
  const paths = dataPaths(cwd)
  if (!existsSync(paths.config)) {
    process.stdout.write('Not initialized. Run `loopyourself init` first.\n')
    process.exitCode = 1
    return
  }
  const config = JSON.parse(readFileSync(paths.config, 'utf8'))
  const board = existsSync(paths.board) ? readFileSync(paths.board, 'utf8') : ''
  const active = countIssues(board, '## Active')
  const backlog = countIssues(board, '## Backlog')
  const lines = [
    'LoopYourself board',
    `  Active:  ${active} (WIP limit ${config.wipLimit})`,
    `  Backlog: ${backlog}`,
  ]
  process.stdout.write(lines.join('\n') + '\n')
}

function countIssues(board, heading) {
  const section = board.split(heading)[1]
  if (!section) return 0
  return section.split('\n').filter((line) => /^\s*[-\d]/.test(line.replace('<!--', '').trim()) && line.trim() !== '' && !line.trim().startsWith('<!--')).length
}
