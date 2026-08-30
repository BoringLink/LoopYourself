import { test } from 'node:test'
import assert from 'node:assert/strict'
import { rmSync, writeFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { mkrepo, ly, lyFail } from './helpers.js'
import { validateStatusMap, resolveLinearState, PUSHABLE_STATUSES } from '../lib/linearmap.js'


function fullMap() {
  const map = {}
  for (const s of PUSHABLE_STATUSES) map[s] = s
  return map
}


test('link records linear scope in config', () => {
  const dir = mkrepo()
  try {
    ly(dir, 'init')
    ly(dir, 'link', 'Boring Link', 'LoopYourself')
    const config = JSON.parse(readFileSync(join(dir, '.loopyourself/config.json'), 'utf8'))
    assert.equal(config.linear.team, 'Boring Link')
    assert.equal(config.linear.project, 'LoopYourself')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('verify fails when statusMap incomplete', () => {
  const dir = mkrepo()
  try {
    ly(dir, 'init')
    ly(dir, 'link', 'MyTeam')
    const err = lyFail(dir, 'verify')
    assert.ok(err, 'verify should fail with incomplete statusMap')
    assert.match(err.stdout, /statusMap: INCOMPLETE/)
    assert.match(err.stdout, /Backlog/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('verify passes with complete statusMap', () => {
  const dir = mkrepo()
  try {
    ly(dir, 'init')
    ly(dir, 'link', 'MyTeam')
    const file = join(dir, '.loopyourself/config.json')
    const config = JSON.parse(readFileSync(file, 'utf8'))
    config.linear.statusMap = fullMap()
    writeFileSync(file, JSON.stringify(config, null, 2))
    const out = ly(dir, 'verify')
    assert.match(out, /push preflight passes/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('validateStatusMap lists every missing pushable status', () => {
  const config = { linear: { statusMap: {} } }
  const { ok, errors } = validateStatusMap(config)
  assert.equal(ok, false)
  assert.equal(errors.length, PUSHABLE_STATUSES.length)
})

test('resolveLinearState refuses unmapped status without fallback', () => {
  const map = fullMap()
  delete map['In Review']
  const config = { linear: { statusMap: map } }
  assert.throws(() => resolveLinearState(config, 'In Review'), /In Review/)
})

test('resolveLinearState refuses Blocked (local-only)', () => {
  const config = { linear: { statusMap: fullMap() } }
  assert.throws(() => resolveLinearState(config, 'Blocked'), /local-only/)
})

test('resolveLinearState resolves a mapped status', () => {
  const map = fullMap()
  map.Ready = 'Todo'
  const config = { linear: { statusMap: map } }
  assert.equal(resolveLinearState(config, 'Ready'), 'Todo')
  assert.equal(resolveLinearState(config, 'In Review'), 'In Review')
})
