import { existsSync, readFileSync, appendFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { BOARD_TEMPLATE, DEFAULT_CONFIG, DATA_DIR } from '../constants.js'
import { ensureDir, writeJson, writeText, dataPaths } from '../lib/fsutil.js'

// Detect repository conventions: AGENTS.md at repo root (OpenCode/Claude Code convention).
export function detectConventions(cwd) {
  for (const name of ['AGENTS.md', 'CLAUDE.md']) {
    const file = join(cwd, name)
    if (existsSync(file)) {
      return { file: name, hint: readFileSync(file, 'utf8').slice(0, 400) }
    }
  }
  return null
}

// Loop state is machine-local (see commands/loop.js): keep it out of the user's
// git history while the rest of .loopyourself/ stays committed by default.
function gitignoreLoopState(cwd) {
  const line = `${DATA_DIR}/loop.json`
  const file = join(cwd, '.gitignore')
  if (existsSync(file)) {
    const lines = readFileSync(file, 'utf8').split('\n')
    if (!lines.includes(line)) appendFileSync(file, `${line}\n`)
  } else {
    writeFileSync(file, `${line}\n`)
  }
}

export function runInit(cwd) {
  const paths = dataPaths(cwd)
  const existed = existsSync(paths.config)

  ensureDir(paths.root)
  ensureDir(paths.projects)

  if (!existed) {
    const config = { ...DEFAULT_CONFIG, conventions: detectConventions(cwd) }
    writeJson(paths.config, config)
    writeText(paths.board, BOARD_TEMPLATE)
    ensureDir(join(paths.projects, 'default'))
    writeText(join(paths.projects, 'default', '.gitkeep'), '')
    gitignoreLoopState(cwd)
  }

  const config = JSON.parse(readFileSync(paths.config, 'utf8'))
  const lines = [
    existed ? 'LoopYourself already initialized (data preserved).' : 'LoopYourself initialized.',
    `  data: ${DATA_DIR}/ (committed to git by default; gitignore to opt out)`,
  ]
  if (config.conventions) {
    lines.push(`  conventions: detected ${config.conventions.file} — the loop must obey repository conventions`)
  } else {
    lines.push('  conventions: no AGENTS.md/CLAUDE.md found (re-run init after adding one)')
  }
  process.stdout.write(lines.join('\n') + '\n')
}
