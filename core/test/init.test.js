import { test } from 'node:test'
import assert from 'node:assert/strict'
import { rmSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { mkrepo, ly, lyFail } from './helpers.js'


test('init creates data directory with config, board and gitignore', () => {
  const dir = mkrepo()
  try {
    const out = ly(dir, 'init')
    assert.match(out, /LoopYourself initialized/)
    const config = JSON.parse(readFileSync(join(dir, '.loopyourself/config.json'), 'utf8'))
    assert.equal(config.wipLimit, 1)
    assert.equal(config.review.maxRounds, 3)
    assert.equal(config.loop.maxConsecutiveBlocked, 2)
    assert.equal(config.autoPush, false)
    assert.equal(config.conventions.file, 'AGENTS.md')
    const board = readFileSync(join(dir, '.loopyourself/board.md'), 'utf8')
    assert.match(board, /## Active/)
    assert.match(board, /## Backlog/)
    const gitignore = readFileSync(join(dir, '.gitignore'), 'utf8')
    assert.match(gitignore, /\.loopyourself\/loop\.json/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('init without AGENTS.md gives hint, not error', () => {
  const dir = mkrepo()
  try {
    rmSync(join(dir, 'AGENTS.md'))
    const out = ly(dir, 'init')
    assert.match(out, /no AGENTS\.md\/CLAUDE\.md found/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('init is idempotent — preserves modified config and conventions', () => {
  const dir = mkrepo()
  try {
    ly(dir, 'init')
    const file = join(dir, '.loopyourself/config.json')
    const config = JSON.parse(readFileSync(file, 'utf8'))
    config.wipLimit = 3
    writeFileSync(file, JSON.stringify(config, null, 2))
    const out = ly(dir, 'init')
    assert.match(out, /already initialized/)
    const after = JSON.parse(readFileSync(file, 'utf8'))
    assert.equal(after.wipLimit, 3)
    assert.equal(after.conventions.file, 'AGENTS.md')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('status before init fails with guidance', () => {
  const dir = mkrepo()
  try {
    const err = lyFail(dir, 'status')
    assert.ok(err)
    assert.match(err.stderr, /Not initialized/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
