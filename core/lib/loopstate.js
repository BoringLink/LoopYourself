import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'

const LOOP_FILE = join('.loopyourself', 'loop.json')
const STOPPED = { running: false, consecutiveBlocked: 0 }

export function loopPath(cwd) {
  return join(cwd, LOOP_FILE)
}

export function readLoopState(cwd) {
  const file = loopPath(cwd)
  if (!existsSync(file)) return { ...STOPPED }
  return JSON.parse(readFileSync(file, 'utf8'))
}

export function writeLoopState(cwd, state) {
  const file = loopPath(cwd)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, JSON.stringify(state, null, 2) + '\n')
}
