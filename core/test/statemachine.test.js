import { test } from 'node:test'
import assert from 'node:assert/strict'
import { rmSync, readFileSync, writeFileSync } from 'node:fs'
import { mkrepo, ly, lyFail, issueFile } from './helpers.js'


test('full happy path: Ready -> Done', () => {
  const dir = mkrepo()
  try {
    ly(dir, 'init')
    ly(dir, 'create', 'Fix login timeout')
    ly(dir, 'ready', 'all')
    ly(dir, 'advance', 'LY-001')
    ly(dir, 'advance', 'LY-001')
    ly(dir, 'advance', 'LY-001')
    const out = ly(dir, 'done', 'LY-001')
    assert.match(out, /In Review -> Done/)
    assert.match(ly(dir, 'status'), /done 1/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('advance rejects illegal jumps (Backlog straight to workflow)', () => {
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
    ly(dir, 'create', 'A')
    ly(dir, 'ready', 'all')
    ly(dir, 'advance', 'LY-001')
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
    ly(dir, 'create', 'A')
    ly(dir, 'ready', 'all')
    ly(dir, 'advance', 'LY-001')
    ly(dir, 'advance', 'LY-001')
    ly(dir, 'advance', 'LY-001')
    const out = ly(dir, 'advance', 'LY-001', '--review-fail')
    assert.match(out, /In Review -> In Progress/)
    const text = readFileSync(issueFile(dir, 'LY-001'), 'utf8')
    assert.match(text, /reviewRounds: 1/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('advance resumes a Blocked issue into In Progress', () => {
  const dir = mkrepo()
  try {
    ly(dir, 'init')
    ly(dir, 'create', 'A')
    ly(dir, 'ready', 'all')
    ly(dir, 'block', 'LY-001')
    const out = ly(dir, 'advance', 'LY-001')
    assert.match(out, /Blocked -> In Progress/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('block rejects Backlog and terminal issues', () => {
  const dir = mkrepo()
  try {
    ly(dir, 'init')
    ly(dir, 'create', 'A')
    const e1 = lyFail(dir, 'block', 'LY-001')
    assert.match(e1.stderr, /not in the workflow/)
    const file = issueFile(dir, 'LY-001')
    const text = readFileSync(file, 'utf8').replace('status: Backlog', 'status: Done')
    writeFileSync(file, text)
    const e2 = lyFail(dir, 'block', 'LY-001')
    assert.match(e2.stderr, /terminal/)
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
    assert.match(ly(dir, 'loop'), /loop stopped/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('done resets the consecutive blocked streak', () => {
  const dir = mkrepo()
  try {
    ly(dir, 'init')
    for (const title of ['A', 'B', 'C']) ly(dir, 'create', title)
    ly(dir, 'ready', 'all')
    ly(dir, 'start')
    ly(dir, 'block', 'LY-001') // streak 1
    ly(dir, 'advance', 'LY-002')
    ly(dir, 'advance', 'LY-002')
    ly(dir, 'advance', 'LY-002')
    ly(dir, 'done', 'LY-002') // success resets streak
    const out = ly(dir, 'block', 'LY-003') // streak 1 again — no stop
    assert.doesNotMatch(out, /loop stopped/)
    assert.match(ly(dir, 'loop'), /loop running/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('reorder re-sequences the Active pool and status reflects it', () => {
  const dir = mkrepo()
  try {
    ly(dir, 'init')
    for (const title of ['A', 'B', 'C']) ly(dir, 'create', title)
    ly(dir, 'ready', 'all')
    const out = ly(dir, 'reorder', 'LY-003', 'LY-001')
    assert.match(out, /LY-003 -> LY-001 -> LY-002/)
    const status = ly(dir, 'status')
    assert.match(status, /1\. LY-003 \[Ready\] C/)
    assert.match(status, /2\. LY-001 \[Ready\] A/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
