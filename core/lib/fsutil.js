import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

export function readJsonIfExists(file) {
  if (!existsSync(file)) return null
  return JSON.parse(readFileSync(file, 'utf8'))
}

export function writeJson(file, data) {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, JSON.stringify(data, null, 2) + '\n')
}

export function writeText(file, text) {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, text)
}

export function ensureDir(dir) {
  mkdirSync(dir, { recursive: true })
}

export function dataPaths(cwd) {
  const root = join(cwd, DATA_DIR)
  return {
    root,
    config: join(root, CONFIG_FILE),
    board: join(root, BOARD_FILE),
    projects: join(root, 'projects'),
  }
}
