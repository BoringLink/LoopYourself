import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { BOARD_TEMPLATE, DEFAULT_CONFIG } from '../constants.js'
import { ensureDir, writeJson, writeText, dataPaths } from '../lib/fsutil.js'

// Detect repository conventions: AGENTS.md at repo root (OpenCode/Claude Code convention).
export function detectConventions(cwd) {
  const candidates = ['AGENTS.md', 'CLAUDE.md']
  for (const name of candidates) {
    const file = join(cwd, name)
    if (existsSync(file)) {
      return { file: name, hint: readHead(file) }
    }
  }
  return null
}

function readHead(file) {
  const text = readFileSync(file, 'utf8')
  return text.slice(0, 400)
}

export function runInit(cwd) {
  const paths = dataPaths(cwd)
  const existed = existsSync(paths.config)

  ensureDir(paths.root)
  ensureDir(paths.projects)

  if (!existed) {
    const config = { ...DEFAULT_CONFIG }
    config.conventions = detectConventions(cwd)
    writeJson(paths.config, config)
    writeText(paths.board, BOARD_TEMPLATE)
    ensureDir(join(paths.projects, 'default'))
    writeText(join(paths.projects, 'default', '.gitkeep'), '')
  }

  const conventions = existsSync(paths.config)
    ? JSON.parse(readFileSync(paths.config, 'utf8')).conventions
    : null

  const lines = [
    existed ? 'LoopYourself already initialized (data preserved).' : 'LoopYourself initialized.',
    `  data: ${DATA_DIR}/ (committed to git by default; gitignore to opt out)`,
  ]
  if (conventions) {
    lines.push(`  conventions: detected ${conventions.file} — the loop must obey repository conventions`)
  } else {
    lines.push('  conventions: no AGENTS.md/CLAUDE.md found (re-run init after adding one)')
  }
  process.stdout.write(lines.join('\n') + '\n')
}
