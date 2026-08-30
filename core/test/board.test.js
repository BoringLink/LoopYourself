import { test } from 'node:test'
import assert from 'node:assert/strict'
import { rmSync, readFileSync, writeFileSync } from 'node:fs'
import { mkrepo, ly, lyFail, issueFile } from './helpers.js'


test('create lands issue in Backlog with frontmatter', () => {
  const dir = mkrepo()
  try {
    ly(dir, 'init')
    const out = ly(dir, 'create', 'Add export feature')
    assert.match(out, /Created LY-001 \[Backlog\] Add export feature/)
    const text = readFileSync(issueFile(dir, 'LY-001'), 'utf8')
    assert.match(text, /^---\n/)
    assert.match(text, /id: LY-001/)
    assert.match(text, /status: Backlog/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('create keeps flags out of the title', () => {
  const dir = mkrepo()
  try {
    ly(dir, 'init')
    const out = ly(dir, 'create', 'Add', 'export', '--priority', '0', '--label:Feature')
    assert.match(out, /\[Backlog\] Add export/)
    assert.doesNotMatch(out, /--priority/)
    const text = readFileSync(issueFile(dir, 'LY-001'), 'utf8')
    assert.match(text, /priority: 0/)
    assert.match(text, /labels: Feature/)
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

test('ready rejects terminal issues', () => {
  const dir = mkrepo()
  try {
    ly(dir, 'init')
    ly(dir, 'create', 'A')
    const file = issueFile(dir, 'LY-001')
    const text = readFileSync(file, 'utf8').replace('status: Backlog', 'status: Done')
    writeFileSync(file, text)
    const err = lyFail(dir, 'ready', 'LY-001')
    assert.ok(err)
    assert.match(err.stderr, /LY-001 is Done \(terminal\)/)
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
    const file = issueFile(dir, 'LY-002')
    const text = readFileSync(file, 'utf8').replace('status: Backlog', 'status: In Progress')
    writeFileSync(file, text)
    const status = ly(dir, 'status')
    assert.match(status, /\[Ready\] A/)
    assert.match(status, /\[In Progress\] B/)
    assert.match(status, /active 2/)
    assert.match(status, /backlog 0/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('status warns when WIP limit is exceeded', () => {
  const dir = mkrepo()
  try {
    ly(dir, 'init')
    ly(dir, 'create', 'A')
    ly(dir, 'create', 'B')
    ly(dir, 'ready', 'all')
    const status = ly(dir, 'status')
    assert.match(status, /WIP limit exceeded — 2\/1/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('attach records the Linear link on an issue', () => {
  const dir = mkrepo()
  try {
    ly(dir, 'init')
    ly(dir, 'create', 'A')
    const out = ly(dir, 'attach', 'LY-001', 'BOR-42', 'https://linear.app/boring-link/issue/BOR-42/x')
    assert.match(out, /linked Linear issue BOR-42/)
    const text = readFileSync(issueFile(dir, 'LY-001'), 'utf8')
    assert.match(text, /linearId: BOR-42/)
    assert.match(text, /linearUrl: https:\/\/linear\.app\/boring-link\/issue\/BOR-42\/x/)
    // roundtrip: loading and re-saving must not accumulate headings or lose fields
    ly(dir, 'ready', 'LY-001')
    const retext = readFileSync(issueFile(dir, 'LY-001'), 'utf8')
    assert.match(retext, /linearId: BOR-42/)
    assert.equal(retext.match(/^# /gm).length, 1)
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
