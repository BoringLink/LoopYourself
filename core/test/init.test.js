import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const CLI = fileURLToPath(new URL('../cli.js', import.meta.url))

function mkrepo(withAgents = true) {
  const dir = mkdtempSync(join(tmpdir(), 'ly-'))
  if (withAgents) {
    writeFileSync(join(dir, 'AGENTS.md'), '# Conventions\n\n- Run `npm test` before committing\n')
  }
  return dir
}

function ly(dir, ...args) {
  return execFileSync('node', [CLI, ...args], { cwd: dir, encoding: 'utf8' })
}


test('init creates data directory with config and board', () => {
  const dir = mkrepo()
  try {
    const out = ly(dir, 'init')
    assert.match(out, /LoopYourself initialized/)
    const config = JSON.parse(execFileSync('cat', [join(dir, '.loopyourself/config.json')], { encoding: 'utf8' }))
    assert.equal(config.wipLimit, 1)
    assert.equal(config.review.maxRounds, 3)
    assert.equal(config.loop.maxConsecutiveBlocked, 2)
    assert.equal(config.autoPush, false)
    assert.ok(config.conventions.file === 'AGENTS.md')
    const board = execFileSync('cat', [join(dir, '.loopyourself/board.md')], { encoding: 'utf8' })
    assert.match(board, /## Active/)
    assert.match(board, /## Backlog/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('init detects AGENTS.md conventions', () => {
  const dir = mkrepo(true)
  try {
    ly(dir, 'init')
    const out = ly(dir, 'init') // idempotent run
    assert.match(out, /already initialized/)
    const config = JSON.parse(execFileSync('cat', [join(dir, '.loopyourself/config.json')], { encoding: 'utf8' }))
    assert.equal(config.conventions.file, 'AGENTS.md')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('init without AGENTS.md gives hint, not error', () => {
  const dir = mkrepo(false)
  try {
    const out = ly(dir, 'init')
    assert.match(out, /no AGENTS\.md\/CLAUDE\.md found/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('init is idempotent — preserves modified config', () => {
  const dir = mkrepo()
  try {
    ly(dir, 'init')
    const file = join(dir, '.loopyourself/config.json')
    const config = JSON.parse(execFileSync('cat', [file], { encoding: 'utf8' }))
    config.wipLimit = 3
    writeFileSync(file, JSON.stringify(config, null, 2))
    ly(dir, 'init')
    const after = JSON.parse(execFileSync('cat', [file], { encoding: 'utf8' }))
    assert.equal(after.wipLimit, 3)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('status before init fails with guidance', () => {
  const dir = mkrepo()
  try {
    let failed = false
    try {
      ly(dir, 'status')
    } catch (err) {
      failed = true
      assert.match(err.stderr, /Not initialized/)
    }
    assert.ok(failed)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
