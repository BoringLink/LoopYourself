import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const CLI = fileURLToPath(new URL('../cli.js', import.meta.url))

function mkrepo() {
  const dir = mkdtempSync(join(tmpdir(), 'ly-'))
  writeFileSync(join(dir, 'AGENTS.md'), '# Conventions\n')
  return dir
}

function ly(dir, ...args) {
  return execFileSync('node', [CLI, ...args], { cwd: dir, encoding: 'utf8' })
}

function lyFail(dir, ...args) {
  try {
    ly(dir, ...args)
  } catch (err) {
    return err
  }
  return null
}

function readyIssue(dir, title) {
  ly(dir, 'create', title)
  ly(dir, 'ready', 'all')
}


test('full happy path: Ready -> Done', () => {
  const dir = mkrepo()
  try {
    ly(dir, 'init')
    readyIssue(dir, 'Fix login timeout')
    ly(dir, 'advance', 'LY-001')
    ly(dir, 'advance', 'LY-001')
    ly(dir, 'advance', 'LY-001')
    const out = ly(dir, 'done', 'LY-001')
    assert.match(out, /In Review -> Done/)
    const status = ly(dir, 'status')
    assert.match(status, /done 1/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('advance rejects illegal jumps (Backlog straight to Done)', () => {
  const dir = mkrepo()
  try {
    ly(dir, 'init')
    ly(dir, 'create', 'A')
    const err = lyFail(dir, 'advance', 'LY-001')
    assert.ok(err)
    assert.match(err.stderr, /cannot advance from Backlog/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('done only from In Review', () => {
  const dir = mkrepo()
  try {
    ly(dir, 'init')
    readyIssue(dir, 'A')
    ly(dir, 'advance', 'LY-001') // Ready -> Todo
    const err = lyFail(dir, 'done', 'LY-001')
    assert.ok(err)
    assert.match(err.stderr, /done only allowed from In Review/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('review-fail path: In Review -> In Progress, rounds increment', () => {
  const dir = mkrepo()
  try {
    ly(dir, 'init')
    readyIssue(dir, 'A')
    ly(dir, 'advance', 'LY-001')
    ly(dir, 'advance', 'LY-001')
    ly(dir, 'advance', 'LY-001') // In Review
    const out = ly(dir, 'advance', 'LY-001', '--review-fail')
    assert.match(out, /In Review -> In Progress/)
    const file = join(dir, '.loopyourself/projects/default/issues/LY-001.md')
    const text = execFileSync('cat', [file], { encoding: 'utf8' })
    assert.match(text, /reviewRounds: 1/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('circuit breaker level 1: block marks Blocked', () => {
  const dir = mkrepo()
  try {
    ly(dir, 'init')
    readyIssue(dir, 'A')
    const out = ly(dir, 'block', 'LY-001')
    assert.match(out, /LY-001: -> Blocked/)
    const status = ly(dir, 'status')
    assert.match(status, /\[Blocked\] A/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('circuit breaker level 2: consecutive blocked stops loop', () => {
  const dir = mkrepo()
  try {
    ly(dir, 'init')
    ly(dir, 'create', 'A')
    ly(dir, 'create', 'B')
    ly(dir, 'ready', 'all')
    ly(dir, 'start')
    ly(dir, 'block', 'LY-001')
    const out = ly(dir, 'block', 'LY-002')
    assert.match(out, /loop stopped: 2 consecutive Blocked/)
    const loopStatus = ly(dir, 'loop')
    assert.match(loopStatus, /loop stopped/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('reorder re-sequences the active pool', () => {
  const dir = mkrepo()
  try {
    ly(dir, 'init')
    ly(dir, 'create', 'A')
    ly(dir, 'create', 'B')
    ly(dir, 'create', 'C')
    ly(dir, 'ready', 'all')
    const out = ly(dir, 'reorder', 'LY-003', 'LY-001')
    assert.match(out, /LY-003 -> LY-001 -> LY-002/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
