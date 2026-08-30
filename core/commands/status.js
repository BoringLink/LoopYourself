import { existsSync, readFileSync } from 'node:fs'
import { dataPaths, writeText } from '../lib/fsutil.js'
import { loadIssues, renderBoard, splitPools } from '../lib/issues.js'

export function runStatus(cwd) {
  const paths = dataPaths(cwd)
  if (!existsSync(paths.config)) {
    process.stdout.write('Not initialized. Run `loopyourself init` first.\n')
    process.exitCode = 1
    return
  }
  const config = JSON.parse(readFileSync(paths.config, 'utf8'))
  const issues = loadIssues(cwd)
  const board = renderBoard(issues, config.wipLimit)
  // board.md is a rendered view of the issue files — keep it fresh.
  writeText(paths.board, board)
  process.stdout.write(board)

  const { active, backlog, terminal } = splitPools(issues)
  const executing = active.filter((i) => i.status !== 'Blocked')
  if (executing.length > (config.wipLimit ?? 1)) {
    process.stdout.write(`WARNING: WIP limit exceeded — ${executing.length}/${config.wipLimit} issues executing\n`)
  }
  process.stdout.write(
    `\nsummary: active ${active.length} (WIP limit ${config.wipLimit}), backlog ${backlog.length}, done ${terminal.length}\n`,
  )
}
