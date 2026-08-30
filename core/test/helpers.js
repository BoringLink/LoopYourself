import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const CLI = fileURLToPath(new URL('../cli.js', import.meta.url))

export function mkrepo() {
  const dir = mkdtempSync(join(tmpdir(), 'ly-'))
  writeFileSync(join(dir, 'AGENTS.md'), '# Conventions\n')
  return dir
}

export function ly(dir, ...args) {
  return execFileSync('node', [CLI, ...args], { cwd: dir, encoding: 'utf8' })
}

export function lyFail(dir, ...args) {
  try {
    ly(dir, ...args)
  } catch (err) {
    return err
  }
  return null
}

export function issueFile(dir, id) {
  return join(dir, '.loopyourself/projects/default/issues', `${id}.md`)
}
