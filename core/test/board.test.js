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

function issueFile(dir, id) {
  return join(dir, '.loopyourself/projects/default/issues', `${id}.md`)
}


test('create lands issue in Backlog with frontmatter', () => {
  const dir = mkrepo()
  try {
    ly(dir, 'init')
    const out = ly(dir, 'create', 'Add export feature')
    assert.match(out, /Created LY-001 \[Backlog\] Add export feature/)
    const text = execFileSync('cat', [issueFile(dir, 'LY-001')], { encoding: 'utf8' })
    assert.match(text, /^---\n/)
    assert.match(text, /id: LY-001/)
    assert.match(text, /status: Backlog/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('ready admits issue into Active pool as Ready', () => {
  const dir = mkrepo()
  try {
    ly(dir, 'init')
    ly(dir, 'create', 'Fix login timeout')
    const out = ly(dir, 'ready', 'LY-001')
    assert.match(out, /LY-001: Backlog → Ready/)
    const status = ly(dir, 'status')
    assert.match(status, /1\. LY-001 \[Ready\] Fix login timeout/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('ready rejects non-Backlog and terminal issues', () => {
  const dir = mkrepo()
  try {
    ly(dir, 'init')
    ly(dir, 'create', 'A')
    // force terminal state on disk
    const file = issueFile(dir, 'LY-001')
    const text = execFileSync('cat', [file], { encoding: 'utf8' }).replace('status: Backlog', 'status: Done')
    writeFileSync(file, text)
    let failed = false
    try {
      ly(dir, 'ready', 'LY-001')
    } catch (err) {
      failed = true
      assert.match(err.stderr, /LY-001 is Done \(terminal\)/)
    }
    assert.ok(failed)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('pool membership is derived from status file edits', () => {
  const dir = mkrepo()
  try {
    ly(dir, 'init')
    ly(dir, 'create', 'A')
    ly(dir, 'create', 'B')
    ly(dir, 'ready', 'LY-001')
    // hand-edit status on disk: B goes straight to Active as In Progress
    const file = issueFile(dir, 'LY-002')
    const text = execFileSync('cat', [file], { encoding: 'utf8' }).replace('status: Backlog', 'status: In Progress')
    writeFileSync(file, text)
    const status = ly(dir, 'status')
    assert.match(status, /\[Ready\] A/)
    assert.match(status, /\[In Progress\] B/)
    assert.match(status, /Backlog: $/m) // A no longer in backlog section
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('status renders empty board after init', () => {
  const dir = mkrepo()
  try {
    ly(dir, 'init')
    const status = ly(dir, 'status')
    assert.match(status, /## Active/)
    assert.match(status, /\(empty\)/)
    assert.match(status, /WIP limit: 1/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
